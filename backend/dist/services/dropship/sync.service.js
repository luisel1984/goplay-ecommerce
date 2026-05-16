import { prisma } from '../../config/prisma.js';
import { logger } from '../../config/logger.js';
import { aliexpressAdapter } from './aliexpress.adapter.js';
import { cjAdapter } from './cjdropshipping.adapter.js';
const adapters = {
    ALIEXPRESS: aliexpressAdapter,
    CJDROPSHIPPING: cjAdapter,
};
export function getAdapter(source) {
    return adapters[source] ?? null;
}
/**
 * Importa un producto desde un proveedor a la BD local.
 * Aplica markup configurable, sincroniza imágenes y variantes.
 */
export async function importDropshipProduct(opts) {
    const adapter = getAdapter(opts.source);
    if (!adapter)
        throw new Error(`No adapter for ${opts.source}`);
    const dp = await adapter.getProduct(opts.externalId);
    const markup = opts.markupPercent ?? 150;
    const priceCents = Math.max(dp.suggestedPriceCents, Math.round(dp.costCents * (1 + markup / 100)));
    const slug = dp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
    const sku = `${opts.source.slice(0, 3)}-${dp.externalId}`.slice(0, 60);
    const product = await prisma.product.upsert({
        where: { sku },
        create: {
            slug, sku, name: dp.name, description: dp.description, brand: dp.brand,
            categoryId: opts.categoryId ?? null, supplierId: opts.supplierId ?? null,
            costCents: dp.costCents, priceCents,
            stock: dp.stock, weightGrams: dp.weightGrams ?? null,
            source: opts.source, externalId: dp.externalId, externalUrl: dp.externalUrl,
            lastSyncedAt: new Date(), publishedAt: new Date(),
            images: { create: dp.images.map((url, i) => ({ url, sortOrder: i, alt: dp.name })) },
            variants: dp.variants ? {
                create: dp.variants.map(v => ({
                    sku: `${sku}-${v.externalId}`, name: v.name, attributes: v.attributes,
                    priceCents: Math.round(v.costCents * (1 + markup / 100)), stock: v.stock,
                    imageUrl: v.imageUrl, externalId: v.externalId,
                })),
            } : undefined,
        },
        update: {
            costCents: dp.costCents, stock: dp.stock, lastSyncedAt: new Date(),
        },
    });
    return product;
}
/**
 * Job programado: actualiza stock de todos los productos dropshipping
 * Recomendado: ejecutar cada hora vía BullMQ cron
 */
export async function syncAllStock() {
    for (const source of ['ALIEXPRESS', 'CJDROPSHIPPING']) {
        const adapter = adapters[source];
        if (!adapter)
            continue;
        const products = await prisma.product.findMany({
            where: { source: source, externalId: { not: null }, active: true },
            select: { id: true, externalId: true },
        });
        if (!products.length)
            continue;
        logger.info({ source, count: products.length }, 'Syncing dropship stock');
        const ids = products.map(p => p.externalId).filter(Boolean);
        const stockMap = await adapter.syncStock(ids);
        for (const p of products) {
            const update = stockMap.get(p.externalId);
            if (!update)
                continue;
            await prisma.product.update({
                where: { id: p.id },
                data: { stock: update.stock, costCents: update.costCents, lastSyncedAt: new Date() },
            });
        }
    }
}
/**
 * Forwardea pedidos pagados a los proveedores correspondientes
 */
export async function forwardOrderToSuppliers(orderId) {
    const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: { include: { product: true } }, shippingAddress: true },
    });
    if (!order.shippingAddress)
        throw new Error('Shipping address required');
    const grouped = new Map();
    for (const item of order.items) {
        if (item.product.source === 'MANUAL' || !item.product.supplierId)
            continue;
        const list = grouped.get(item.product.supplierId) ?? [];
        list.push(item);
        grouped.set(item.product.supplierId, list);
    }
    for (const [supplierId, items] of grouped) {
        const supplier = await prisma.supplier.findUniqueOrThrow({ where: { id: supplierId } });
        const adapter = getAdapter(supplier.source);
        if (!adapter)
            continue;
        for (const item of items) {
            const resp = await adapter.placeOrder({
                externalProductId: item.product.externalId,
                variantId: item.variantId ?? undefined,
                quantity: item.quantity,
                recipient: {
                    fullName: order.shippingAddress.fullName,
                    line1: order.shippingAddress.line1,
                    line2: order.shippingAddress.line2 ?? undefined,
                    postalCode: order.shippingAddress.postalCode,
                    city: order.shippingAddress.city,
                    country: order.shippingAddress.country,
                    phone: order.shippingAddress.phone ?? undefined,
                    email: order.email,
                },
                notes: `Order ${order.number}`,
            });
            await prisma.supplierOrder.create({
                data: {
                    orderId, supplierId, externalOrderId: resp.externalOrderId,
                    status: resp.status, totalCents: resp.totalCents,
                    trackingNumber: resp.trackingNumber, carrier: resp.carrier,
                    rawResponse: resp.raw ?? {},
                },
            });
        }
    }
}
