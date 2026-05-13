import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { aliexpressAdapter } from '../services/dropship/aliexpress.adapter.js';
import { cjAdapter } from '../services/dropship/cjdropshipping.adapter.js';
import { importDropshipProduct, syncAllStock, forwardOrderToSuppliers } from '../services/dropship/sync.service.js';

const router = Router();
router.use(requireAuth, requireRole('ADMIN', 'STAFF'));

router.get('/search', async (req, res, next) => {
  try {
    const { source = 'ALIEXPRESS', q = '', page = 1 } = req.query as any;
    const adapter = source === 'CJDROPSHIPPING' ? cjAdapter : aliexpressAdapter;
    const products = await adapter.searchProducts(String(q), Number(page));
    res.json(products);
  } catch (e) { next(e); }
});

router.get('/product/:source/:externalId', async (req, res, next) => {
  try {
    const adapter = req.params.source === 'CJDROPSHIPPING' ? cjAdapter : aliexpressAdapter;
    const product = await adapter.getProduct(req.params.externalId);
    res.json(product);
  } catch (e) { next(e); }
});

const importSchema = z.object({
  source: z.enum(['ALIEXPRESS', 'CJDROPSHIPPING', 'ALIBABA']),
  externalId: z.string(),
  markupPercent: z.number().min(0).max(1000).default(150),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
});

router.post('/import', async (req, res, next) => {
  try {
    const data = importSchema.parse(req.body);
    const product = await importDropshipProduct(data as any);
    res.status(201).json(product);
  } catch (e) { next(e); }
});

router.post('/sync-stock', async (_req, res, next) => {
  try { await syncAllStock(); res.json({ ok: true }); } catch (e) { next(e); }
});

router.post('/orders/:orderId/forward', async (req, res, next) => {
  try { await forwardOrderToSuppliers(req.params.orderId); res.json({ ok: true }); } catch (e) { next(e); }
});

export default router;
