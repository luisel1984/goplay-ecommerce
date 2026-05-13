import Stripe from 'stripe';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { applicableVatRate, ttcToHt } from '../lib/vat.js';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-09-30.acacia',
  appInfo: { name: 'GoPlayCommerce', version: '1.0.0' },
});

/**
 * Crea un PaymentIntent con cálculo de TVA, métodos europeos
 * (carte, SEPA, Apple/Google Pay, Bancontact, iDEAL, Klarna).
 */
export async function createCheckoutPaymentIntent(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, user: true, shippingAddress: true },
  });

  const intent = await stripe.paymentIntents.create({
    amount: order.totalCents,
    currency: order.currency.toLowerCase(),
    automatic_payment_methods: { enabled: true },
    receipt_email: order.email,
    description: `Commande GoPlayElectronic ${order.number}`,
    metadata: {
      orderId: order.id,
      orderNumber: order.number,
      userId: order.userId ?? 'guest',
    },
    shipping: order.shippingAddress ? {
      name: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone ?? undefined,
      address: {
        line1: order.shippingAddress.line1,
        line2: order.shippingAddress.line2 ?? undefined,
        postal_code: order.shippingAddress.postalCode,
        city: order.shippingAddress.city,
        country: order.shippingAddress.country,
      },
    } : undefined,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: intent.id },
  });

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

/**
 * Webhook: maneja eventos de Stripe (pago confirmado, fallido, refund…).
 */
export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata.orderId;
      if (!orderId) break;
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'CAPTURED',
          status: 'PAID',
          stripeChargeId: typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id,
          paymentMethod: pi.payment_method_types?.[0] ?? 'card',
          events: { create: { type: 'payment', message: `Paiement reçu (${pi.amount / 100}€)`, meta: { id: pi.id } as any } },
        },
      });
      // TODO: trigger forwarding a proveedores dropship + invoice generation
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata.orderId;
      if (!orderId) break;
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED',
          events: { create: { type: 'payment', message: 'Paiement échoué', meta: { id: pi.id } as any } } },
      });
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const orderId = charge.metadata.orderId;
      if (!orderId) break;
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: charge.amount_refunded === charge.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
                status: charge.amount_refunded === charge.amount ? 'REFUNDED' : undefined },
      });
      break;
    }
  }
  return { received: true };
}

/**
 * Crea un reembolso parcial o total
 */
export async function createRefund(orderId: string, amountCents?: number, reason?: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (!order.stripeChargeId) throw new Error('No charge to refund');

  const refund = await stripe.refunds.create({
    charge: order.stripeChargeId,
    amount: amountCents,
    reason: reason as any,
    metadata: { orderId, orderNumber: order.number },
  });

  await prisma.refund.create({
    data: {
      orderId, amountCents: refund.amount, reason: reason ?? null,
      stripeRefundId: refund.id, status: refund.status ?? 'pending',
    },
  });

  return refund;
}
