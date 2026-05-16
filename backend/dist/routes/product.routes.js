import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
const router = Router();
const listSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(24),
    q: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    sort: z.enum(['recent', 'price_asc', 'price_desc', 'name']).default('recent'),
    inStock: z.coerce.boolean().optional(),
});
router.get('/', async (req, res, next) => {
    try {
        const q = listSchema.parse(req.query);
        const where = { active: true, publishedAt: { not: null } };
        if (q.q)
            where.OR = [
                { name: { contains: q.q, mode: 'insensitive' } },
                { description: { contains: q.q, mode: 'insensitive' } },
                { sku: { contains: q.q, mode: 'insensitive' } },
            ];
        if (q.category)
            where.category = { slug: q.category };
        if (q.brand)
            where.brand = q.brand;
        if (q.minPrice)
            where.priceCents = { ...where.priceCents, gte: q.minPrice * 100 };
        if (q.maxPrice)
            where.priceCents = { ...where.priceCents, lte: q.maxPrice * 100 };
        if (q.inStock)
            where.stock = { gt: 0 };
        const orderBy = q.sort === 'price_asc' ? { priceCents: 'asc' } :
            q.sort === 'price_desc' ? { priceCents: 'desc' } :
                q.sort === 'name' ? { name: 'asc' } :
                    { createdAt: 'desc' };
        const [items, total] = await Promise.all([
            prisma.product.findMany({
                where, orderBy,
                take: q.limit, skip: (q.page - 1) * q.limit,
                include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 }, category: true },
            }),
            prisma.product.count({ where }),
        ]);
        res.json({
            items: items.map(p => toPublic(p)),
            page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit),
        });
    }
    catch (e) {
        next(e);
    }
});
router.get('/categories', async (_req, res, next) => {
    try {
        const cats = await prisma.category.findMany({
            where: { active: true }, orderBy: { sortOrder: 'asc' },
            include: { _count: { select: { products: { where: { active: true } } } } },
        });
        res.json(cats.map(c => ({ ...c, productCount: c._count.products })));
    }
    catch (e) {
        next(e);
    }
});
router.get('/:slug', async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({
            where: { slug: req.params.slug },
            include: {
                images: { orderBy: { sortOrder: 'asc' } },
                variants: true, category: true,
                reviews: { where: { approved: true }, include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
            },
        });
        if (!product || !product.active)
            return res.status(404).json({ error: 'not_found' });
        res.json(toPublic(product, true));
    }
    catch (e) {
        next(e);
    }
});
function toPublic(p, full = false) {
    const data = {
        id: p.id, slug: p.slug, sku: p.sku, name: p.name, brand: p.brand,
        price: p.priceCents / 100, compareAt: p.compareAtCents ? p.compareAtCents / 100 : null,
        vatRate: Number(p.vatRate), stock: p.stock, inStock: p.stock > 0,
        image: p.images?.[0]?.url ?? null,
        category: p.category ? { slug: p.category.slug, name: p.category.name } : null,
    };
    if (full) {
        data.description = p.description;
        data.images = (p.images ?? []).map((i) => ({ url: i.url, alt: i.alt }));
        data.variants = (p.variants ?? []).map((v) => ({
            id: v.id, sku: v.sku, name: v.name, attributes: v.attributes,
            price: (v.priceCents ?? p.priceCents) / 100, stock: v.stock,
        }));
        data.reviews = (p.reviews ?? []).map((r) => ({
            rating: r.rating, title: r.title, comment: r.comment,
            author: r.user ? `${r.user.firstName ?? ''} ${(r.user.lastName ?? '').slice(0, 1)}.` : 'Anonyme',
            date: r.createdAt,
        }));
        data.weightGrams = p.weightGrams;
    }
    return data;
}
export default router;
