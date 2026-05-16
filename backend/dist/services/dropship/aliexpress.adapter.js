import crypto from 'node:crypto';
import { env } from '../../config/env.js';
/**
 * AliExpress Open Platform — Dropshipping Center API
 *
 * Doc: https://openservice.aliexpress.com/doc/doc.htm
 * Auth: TOP API (HMAC-SHA256 signing)
 *
 * Endpoints utilisés:
 *  - aliexpress.ds.product.get             → détail produit
 *  - aliexpress.ds.product.search          → recherche
 *  - aliexpress.ds.order.create            → placer commande
 *  - aliexpress.ds.order.tracking.get      → suivi
 */
const ALI_GATEWAY = 'https://api-sg.aliexpress.com/sync';
function signTopRequest(params) {
    const sorted = Object.keys(params).sort().map(k => `${k}${params[k]}`).join('');
    return crypto
        .createHmac('sha256', env.ALIEXPRESS_APP_SECRET)
        .update(sorted)
        .digest('hex')
        .toUpperCase();
}
async function callTop(method, params) {
    const baseParams = {
        method, app_key: env.ALIEXPRESS_APP_KEY,
        sign_method: 'sha256', timestamp: String(Date.now()), v: '2.0', format: 'json',
        ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])),
    };
    baseParams.sign = signTopRequest(baseParams);
    const res = await fetch(`${ALI_GATEWAY}?${new URLSearchParams(baseParams)}`, { method: 'POST' });
    if (!res.ok)
        throw new Error(`AliExpress API ${res.status}`);
    return res.json();
}
export const aliexpressAdapter = {
    source: 'ALIEXPRESS',
    async searchProducts(query, page = 1) {
        if (!env.ALIEXPRESS_APP_KEY)
            return mockSearchAli(query);
        const res = await callTop('aliexpress.ds.product.search', { keywords: query, page_size: 20, page_no: page });
        const items = res?.result?.products ?? [];
        return items.map((p) => ({
            externalId: String(p.product_id), externalUrl: p.product_url,
            name: p.subject, description: p.description ?? '', brand: p.brand,
            costCents: Math.round(p.target_app_sale_price * 100),
            suggestedPriceCents: Math.round(p.target_original_price * 100),
            stock: p.stock ?? 0, images: p.image_urls ?? [],
        }));
    },
    async getProduct(externalId) {
        if (!env.ALIEXPRESS_APP_KEY)
            return mockGetAli(externalId);
        const res = await callTop('aliexpress.ds.product.get', { product_id: externalId, ship_to_country: 'FR', target_currency: 'EUR', target_language: 'FR' });
        const p = res?.result?.ae_item_base_info_dto ?? {};
        const skus = res?.result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o ?? [];
        return {
            externalId, externalUrl: p.detail_url, name: p.subject, description: p.detail ?? '',
            brand: p.brand, costCents: Math.round((p.app_sale_price ?? 0) * 100),
            suggestedPriceCents: Math.round((p.original_price ?? 0) * 100), stock: p.stock ?? 0,
            images: p.image_urls?.split(';') ?? [],
            variants: skus.map((s) => ({
                externalId: String(s.sku_id), name: s.sku_attr ?? '',
                attributes: parseAliAttrs(s.sku_attr ?? ''),
                costCents: Math.round((s.offer_sale_price ?? 0) * 100),
                stock: s.sku_available_stock ?? 0,
            })),
        };
    },
    async syncStock(externalIds) {
        const map = new Map();
        for (const id of externalIds) {
            try {
                const p = await this.getProduct(id);
                map.set(id, { stock: p.stock, costCents: p.costCents });
            }
            catch (e) { /* skip */ }
        }
        return map;
    },
    async placeOrder(req) {
        if (!env.ALIEXPRESS_APP_KEY) {
            return { externalOrderId: 'ALI-MOCK-' + Date.now(), status: 'placed', totalCents: 0 };
        }
        const res = await callTop('aliexpress.ds.order.create', {
            param_place_order_request4_open_api_d_t_o: {
                product_items: [{ product_id: req.externalProductId, sku_attr: req.variantId, product_count: req.quantity }],
                logistics_address: {
                    contact_person: req.recipient.fullName, full_name: req.recipient.fullName,
                    address: req.recipient.line1, address2: req.recipient.line2,
                    city: req.recipient.city, country: req.recipient.country, zip: req.recipient.postalCode,
                    mobile_no: req.recipient.phone, phone_country: '+33',
                },
            },
        });
        const orderId = res?.result?.order_list?.[0]?.order_id;
        return { externalOrderId: String(orderId), status: orderId ? 'placed' : 'failed', totalCents: 0, raw: res };
    },
    async getOrderStatus(externalOrderId) {
        if (!env.ALIEXPRESS_APP_KEY)
            return { status: 'shipped', trackingNumber: 'TRACK' + externalOrderId, carrier: 'AliExpress Standard' };
        const res = await callTop('aliexpress.ds.order.tracking.get', { ae_order_id: externalOrderId });
        const t = res?.result?.tracking_detail_line_list?.tracking_detail?.[0];
        return { status: t?.status ?? 'pending', trackingNumber: res?.result?.mail_no, carrier: res?.result?.logistics_no };
    },
};
function parseAliAttrs(s) {
    const out = {};
    s.split(';').forEach(part => { const [k, v] = part.split(':'); if (k && v)
        out[k] = v; });
    return out;
}
// ─── Mock para development sin credenciales ─────────────────
function mockSearchAli(q) {
    return [{
            externalId: 'ali-mock-001', externalUrl: 'https://aliexpress.com/item/mock',
            name: `[MOCK] Resultado para: ${q}`, description: 'Producto de demostración',
            costCents: 1200, suggestedPriceCents: 2999, stock: 999,
            images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
        }];
}
function mockGetAli(id) {
    return { externalId: id, externalUrl: `https://aliexpress.com/item/${id}`, name: '[MOCK] Producto AliExpress',
        description: 'Mock product', costCents: 1200, suggestedPriceCents: 2999, stock: 100,
        images: [], weightGrams: 200, shippingDays: { min: 7, max: 15 } };
}
