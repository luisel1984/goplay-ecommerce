import { Router } from 'express';
import { prisma } from '../config/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { generateInvoicePDF } from '../services/invoice.service.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
      include: { items: { take: 3, include: { product: { include: { images: { take: 1 } } } } } },
    });
    res.json(orders.map(o => ({
      id: o.id, number: o.number, status: o.status, paymentStatus: o.paymentStatus,
      total: o.totalCents / 100, currency: o.currency, createdAt: o.createdAt,
      items: o.items.map(i => ({ name: i.name, quantity: i.quantity, image: (i as any).product?.images?.[0]?.url })),
    })));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.sub },
      include: {
        items: { include: { product: { include: { images: { take: 1 } } } } },
        shippingAddress: true, billingAddress: true,
        events: { orderBy: { createdAt: 'asc' } },
        supplierOrders: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'not_found' });
    res.json(order);
  } catch (e) { next(e); }
});

router.get('/:id/invoice', async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user!.sub } });
    if (!order) return res.status(404).json({ error: 'not_found' });
    if (order.paymentStatus !== 'CAPTURED') return res.status(400).json({ error: 'not_paid' });

    const { buffer, invoiceNumber } = await generateInvoicePDF(order.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNumber}.pdf"`);
    res.send(buffer);
  } catch (e) { next(e); }
});

export default router;
