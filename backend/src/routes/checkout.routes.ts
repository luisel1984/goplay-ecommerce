import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { prisma } from '../config/prisma.js';
import { optionalAuth } from '../middleware/auth.js';
import { applicableVatRate, ttcToHt } from '../lib/vat.js';
import { getShippingQuotes } from '../services/shipping.service.js';
import { createCheckoutPaymentIntent } from '../services/stripe.service.js';

const router = Router();
router.use(optionalAuth);

router.post('/quote', async (req, res, next) => {
  try {
    const { country = 'FR', weightGrams = 500, subtotalCents } = req.body;
    res.json({ quotes: getShippingQuotes({ country, weightGrams, subtotalCents }) });
  } catch (e) { next(e); }
});

const createOrderSchema = z.object({
  cartId: z.string(),
  email: z.string().email(),
  shippingAddress: z.object({
    fullName: z.string(), line1: z.string(), line2: z.string().optional(),
    postalCode: z.string(), city: z.string(), country: z.string().default('FR'),
    phone: z.string().optional(),
  }),
  billingAddress: z.object({
    fullName: z.string(), line1: z.string(), line2: z.string().optional(),
    postalCode: z.string(), city: z.string(), country: z.string().default('FR'),
    phone: z.string().optional(),
  }).optional(),
  shippingMethod: z.string(), shippingPointId: z.string().optional(),
  shippingCents: z.number().int(),
  notes: z.string().optional(),
});

router.post('/order', async (req, res, next) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const cart = await prisma.cart.findUnique({
      where: { id: data.cartId },
      include: { items: { include: { product: true, variant: true } }, coupon: true },
    });
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'cart_empty' });

    // Cálculos TVA por línea
    let subtotalCents = 0, vatCents = 0;
    const orderItems = cart.items.map(i => {
      const unitPrice = i.priceCents;
      const lineTotal = unitPrice * i.quantity;
      const rate = Number(i.product.vatRate);
      const { vatCents: lineVat } = ttcToHt(lineTotal, rate);
      subtotalCents += lineTotal;
      vatCents += lineVat;
      return {
        productId: i.productId, variantId: i.variantId, name: i.product.name, sku: i.product.sku,
        quantity: i.quantity, unitPriceCents: unitPrice, vatRate: rate, vatCents: lineVat,
        totalCents: lineTotal,
      };
    });

    let discountCents = 0;
    if (cart.coupon) {
      discountCents = cart.coupon.type === 'PERCENT'
        ? Math.round(subtotalCents * (cart.coupon.valueCents / 100))
        : cart.coupon.valueCents;
    }

    const totalCents = Math.max(0, subtotalCents - discountCents) + data.shippingCents;
    const userId = (req as any).user?.sub;

    // Crear addresses (snapshot) si user logueado
    let shippingAddressId: string | undefined;
    let billingAddressId: string | undefined;
    if (userId) {
      const sa = await prisma.address.create({ data: { ...data.shippingAddress, userId, type: 'shipping' } });
      shippingAddressId = sa.id;
      if (data.billingAddress) {
        const ba = await prisma.address.create({ data: { ...data.billingAddress, userId, type: 'billing' } });
        billingAddressId = ba.id;
      }
    }

    const order = await prisma.order.create({
      data: {
        number: `FR-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`,
        userId, email: data.email,
        subtotalCents, discountCents, shippingCents: data.shippingCents, vatCents, totalCents,
        shippingAddressId, billingAddressId: billingAddressId ?? shippingAddressId,
        shippingMethod: data.shippingMethod, shippingPointId: data.shippingPointId,
        couponId: cart.couponId, notes: data.notes,
        ipAddress: req.ip, userAgent: req.headers['user-agent'],
        items: { create: orderItems },
        events: { create: { type: 'status_change', message: 'Commande créée' } },
      },
      include: { items: true },
    });

    // Crear PaymentIntent Stripe
    const { clientSecret, paymentIntentId } = await createCheckoutPaymentIntent(order.id);

    // Limpiar carrito
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.status(201).json({
      orderId: order.id, orderNumber: order.number,
      clientSecret, paymentIntentId, total: totalCents / 100,
    });
  } catch (e) { next(e); }
});

export default router;
