import { env } from '../../config/env.js';
import type { DropshipAdapter, DropshipProduct, DropshipOrderRequest, DropshipOrderResponse } from './types.js';

/**
 * CJDropshipping API
 * Doc: https://developers.cjdropshipping.com/en/api/introduction.html
 * Auth: API access token via /v1/authentication/getAccessToken
 */
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  if (!env.CJ_API_TOKEN) return '';

  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.CJ_EMAIL, password: env.CJ_API_TOKEN }),
  });
  const data = await res.json() as any;
  cachedToken = { token: data.data.accessToken, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return cachedToken.token;
}

async function cjFetch<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${CJ_BASE}${path}`, {
    ...opts,
    headers: { 'CJ-Access-Token': token, 'Content-Type': 'application/json', ...(opts.headers as any) },
  });
  if (!res.ok) throw new Error(`CJ API ${res.status}`);
  return res.json() as Promise<T>;
}

export const cjAdapter: DropshipAdapter = {
  source: 'CJDROPSHIPPING',

  async searchProducts(query, page = 1) {
    if (!env.CJ_API_TOKEN) return mockCjSearch(query);
    const res = await cjFetch<any>(`/product/list?productName=${encodeURIComponent(query)}&pageNum=${page}&pageSize=20`);
    return (res.data?.list ?? []).map((p: any) => ({
      externalId: p.pid, externalUrl: `https://cjdropshipping.com/product/${p.productSku}.html`,
      name: p.productNameEn, description: p.description ?? '',
      costCents: Math.round(parseFloat(p.sellPrice) * 100),
      suggestedPriceCents: Math.round(parseFloat(p.sellPrice) * 100 * 2.5),
      stock: p.stock ?? 0, images: [p.productImage].filter(Boolean),
      weightGrams: Math.round(p.productWeight ?? 0),
    }));
  },

  async getProduct(externalId) {
    if (!env.CJ_API_TOKEN) return mockCjGet(externalId);
    const res = await cjFetch<any>(`/product/query?pid=${externalId}`);
    const p = res.data;
    return {
      externalId: p.pid, externalUrl: `https://cjdropshipping.com/product/${p.productSku}.html`,
      name: p.productNameEn, description: p.description ?? '', brand: p.brand,
      costCents: Math.round(parseFloat(p.sellPrice) * 100),
      suggestedPriceCents: Math.round(parseFloat(p.sellPrice) * 100 * 2.5),
      stock: p.stock ?? 0, weightGrams: p.productWeight,
      images: p.productImageSet ?? [],
      variants: (p.variants ?? []).map((v: any) => ({
        externalId: v.vid, name: v.variantNameEn, attributes: v.variantKey ? JSON.parse(v.variantKey) : {},
        costCents: Math.round(parseFloat(v.variantSellPrice) * 100), stock: v.variantStock ?? 0,
        imageUrl: v.variantImage,
      })),
    };
  },

  async syncStock(externalIds) {
    const map = new Map();
    for (const id of externalIds) {
      try {
        const p = await this.getProduct(id);
        map.set(id, { stock: p.stock, costCents: p.costCents });
      } catch {}
    }
    return map;
  },

  async placeOrder(req: DropshipOrderRequest): Promise<DropshipOrderResponse> {
    if (!env.CJ_API_TOKEN) return { externalOrderId: 'CJ-MOCK-' + Date.now(), status: 'placed', totalCents: 0 };
    const res = await cjFetch<any>('/shopping/order/createOrder', {
      method: 'POST',
      body: JSON.stringify({
        orderNumber: `GP${Date.now()}`,
        shippingZip: req.recipient.postalCode,
        shippingCountryCode: req.recipient.country,
        shippingProvince: req.recipient.city,
        shippingCity: req.recipient.city,
        shippingAddress: req.recipient.line1,
        shippingCustomerName: req.recipient.fullName,
        shippingPhone: req.recipient.phone,
        remark: req.notes ?? 'GoPlayElectronic order',
        products: [{ vid: req.variantId ?? req.externalProductId, quantity: req.quantity }],
      }),
    });
    const orderId = res.data?.orderId;
    return { externalOrderId: orderId, status: orderId ? 'placed' : 'failed', totalCents: 0, raw: res };
  },

  async getOrderStatus(externalOrderId) {
    if (!env.CJ_API_TOKEN) return { status: 'shipped', trackingNumber: 'TRACK' + externalOrderId };
    const res = await cjFetch<any>(`/logistic/trackInfo?trackNumber=${externalOrderId}`);
    return { status: res.data?.statusName ?? 'pending', trackingNumber: res.data?.trackingNumber, carrier: res.data?.logisticsName };
  },
};

function mockCjSearch(q: string): DropshipProduct[] {
  return [{
    externalId: 'cj-mock-001', externalUrl: 'https://cjdropshipping.com/product/mock.html',
    name: `[MOCK CJ] ${q}`, description: 'Mock CJ product',
    costCents: 800, suggestedPriceCents: 2499, stock: 500,
    images: [], weightGrams: 150, shippingDays: { min: 5, max: 12 },
  }];
}
function mockCjGet(id: string): DropshipProduct {
  return { externalId: id, externalUrl: `https://cjdropshipping.com/product/${id}.html`,
    name: '[MOCK] Producto CJ', description: 'Mock', costCents: 800, suggestedPriceCents: 2499,
    stock: 100, images: [], weightGrams: 150, shippingDays: { min: 5, max: 12 } };
}
