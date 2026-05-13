import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createRefund } from '../services/stripe.service.js';
import { generateInvoicePDF } from '../services/invoice.service.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN', 'STAFF'));

// ─── KPIs Dashboard ──────────────────────────────────────────
router.get('/dashboard', async (_req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalOrders, paidOrders, monthRevenue, lowStock, pending, customers] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { paymentStatus: 'CAPTURED' } }),
      prisma.order.aggregate({ _sum: { totalCents: true }, where: { createdAt: { gte: monthStart }, paymentStatus: 'CAPTURED' } }),
      prisma.product.count({ where: { stock: { lte: 5 }, active: true } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);
    res.json({
      totalOrders, paidOrders, customers, lowStock, pending,
      monthRevenue: (monthRevenue._sum.totalCents ?? 0) / 100,
    });
  } catch (e) { next(e); }
});

// ─── Productos (CRUD admin) ──────────────────────────────────
router.get('/products', async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true, supplier: true, images: { take: 1 } },
    });
    res.json(products);
  } catch (e) { next(e); }
});

const productSchema = z.object({
  slug: z.string(), sku: z.string(), name: z.string(),
  description: z.string(), brand: z.string().optional(),
  categoryId: z.string().optional(), priceCents: z.number().int(),
  costCents: z.number().int(), stock: z.number().int(), vatRate: z.number().default(20),
  active: z.boolean().default(true),
});

router.post('/products', async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({ data: { ...data, publishedAt: new Date() } as any });
    res.status(201).json(product);
  } catch (e) { next(e); }
});

router.patch('/products/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    res.json(product);
  } catch (e) { next(e); }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ─── Pedidos (admin) ─────────────────────────────────────────
router.get('/orders', async (req, res, next) => {
  try {
    const status = req.query.status as string;
    const orders = await prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' }, take: 100,
      include: { items: true, user: { select: { email: true, firstName: true, lastName: true } } },
    });
    res.json(orders);
  } catch (e) { next(e); }
});

router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status, trackingNumber, carrier, message } = req.body;
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status, trackingNumber, carrier,
        events: { create: { type: 'status_change', message: message ?? `Statut: ${status}` } },
      },
    });
    res.json(updated);
  } catch (e) { next(e); }
});

router.post('/orders/:id/refund', async (req, res, next) => {
  try {
    const { amountCents, reason } = req.body;
    const refund = await createRefund(req.params.id, amountCents, reason);
    res.json(refund);
  } catch (e) { next(e); }
});

router.get('/orders/:id/invoice', async (req, res, next) => {
  try {
    const { buffer, invoiceNumber } = await generateInvoicePDF(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
    res.send(buffer);
  } catch (e) { next(e); }
});

// ─── Reportes ────────────────────────────────────────────────
router.get('/reports/sales', async (req, res, next) => {
  try {
    const from = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to as string) : new Date();
    const orders = await prisma.order.findMany({
      where: { paymentStatus: 'CAPTURED', createdAt: { gte: from, lte: to } },
      include: { items: true },
    });
    const totalRevenue = orders.reduce((a, o) => a + o.totalCents, 0) / 100;
    const totalVat = orders.reduce((a, o) => a + o.vatCents, 0) / 100;
    const totalOrders = orders.length;
    const aov = totalOrders ? totalRevenue / totalOrders : 0;
    res.json({ from, to, totalRevenue, totalVat, totalOrders, aov });
  } catch (e) { next(e); }
});

export default router;
