import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.use(optionalAuth);

async function getOrCreateCart(req: any) {
  const userId = req.user?.sub;
  const sessionId = req.headers['x-session-id'];

  if (userId) {
    return prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: { items: { include: { product: { include: { images: { take: 1 } } }, variant: true } }, coupon: true },
    });
  }
  if (sessionId) {
    return prisma.cart.upsert({
      where: { sessionId },
      create: { sessionId },
      update: {},
      include: { items: { include: { product: { include: { images: { take: 1 } } }, variant: true } }, coupon: true },
    });
  }
  return null;
}

router.get('/', async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req);
    res.json(cart ? toPublic(cart) : { items: [], total: 0 });
  } catch (e) { next(e); }
});

const addSchema = z.object({ productId: z.string(), variantId: z.string().optional(), quantity: z.number().int().min(1).default(1) });

router.post('/items', async (req, res, next) => {
  try {
    const { productId, variantId, quantity } = addSchema.parse(req.body);
    const cart = await getOrCreateCart(req);
    if (!cart) return res.status(400).json({ error: 'session_required' });
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    if (product.trackInventory && product.stock < quantity) return res.status(400).json({ error: 'out_of_stock' });
    await prisma.cartItem.upsert({
      where: { cartId_productId_variantId: { cartId: cart.id, productId, variantId: variantId ?? null as any } },
      create: { cartId: cart.id, productId, variantId, quantity, priceCents: product.priceCents },
      update: { quantity: { increment: quantity } },
    });
    const updated = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: { include: { product: { include: { images: { take: 1 } } }, variant: true } }, coupon: true },
    });
    res.json(toPublic(updated!));
  } catch (e) { next(e); }
});

router.patch('/items/:itemId', async (req, res, next) => {
  try {
    const { quantity } = z.object({ quantity: z.number().int().min(0) }).parse(req.body);
    if (quantity === 0) await prisma.cartItem.delete({ where: { id: req.params.itemId } });
    else await prisma.cartItem.update({ where: { id: req.params.itemId }, data: { quantity } });
    const cart = await getOrCreateCart(req);
    res.json(cart ? toPublic(cart) : { items: [] });
  } catch (e) { next(e); }
});

router.delete('/items/:itemId', async (req, res, next) => {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.itemId } });
    const cart = await getOrCreateCart(req);
    res.json(cart ? toPublic(cart) : { items: [] });
  } catch (e) { next(e); }
});

router.post('/coupon', async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string() }).parse(req.body);
    const cart = await getOrCreateCart(req);
    if (!cart) return res.status(400).json({ error: 'no_cart' });
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.active) return res.status(404).json({ error: 'invalid_coupon' });
    if (coupon.validUntil && coupon.validUntil < new Date()) return res.status(400).json({ error: 'expired' });
    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) return res.status(400).json({ error: 'max_uses_reached' });
    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: coupon.id } });
    res.json({ ok: true, coupon });
  } catch (e) { next(e); }
});

router.delete('/coupon', async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req);
    if (!cart) return res.json({ ok: true });
    await prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

function toPublic(cart: any) {
  const items = cart.items.map((i: any) => ({
    id: i.id, productId: i.productId, name: i.product.name, slug: i.product.slug,
    variant: i.variant?.name, image: i.product.images?.[0]?.url,
    quantity: i.quantity, unitPrice: i.priceCents / 100,
    subtotal: (i.priceCents * i.quantity) / 100, vatRate: Number(i.product.vatRate),
  }));
  const subtotal = items.reduce((a: number, i: any) => a + i.subtotal, 0);
  let discount = 0;
  if (cart.coupon) {
    discount = cart.coupon.type === 'PERCENT' ? subtotal * (cart.coupon.valueCents / 100) : cart.coupon.valueCents / 100;
  }
  return {
    id: cart.id, items, subtotal,
    coupon: cart.coupon ? { code: cart.coupon.code, type: cart.coupon.type, value: cart.coupon.valueCents } : null,
    discount, total: Math.max(0, subtotal - discount),
  };
}

export default router;
