/**
 * Cliente API tipado para el backend GoPlayCommerce.
 * Maneja access token + refresh, sessionId para invitados.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
  }
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('gp_session_id');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('gp_session_id', sid);
  }
  return sid;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gp_access_token');
}

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const sessionId = typeof window !== 'undefined' ? getSessionId() : '';

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(init.headers as any),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(sessionId ? { 'x-session-id': sessionId } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.message || data.error || `HTTP ${res.status}`, data);
  }
  if (res.status === 204) return null as any;
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return res.json();
  return res.blob() as any;
}

// ─── Auth helpers ─────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: any; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  signup: (data: any) => apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  logout: (refreshToken: string) => apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  storeToken: (accessToken: string, refreshToken: string, user: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('gp_access_token', accessToken);
    localStorage.setItem('gp_refresh_token', refreshToken);
    localStorage.setItem('gp_user', JSON.stringify(user));
  },
  clearToken: () => {
    if (typeof window === 'undefined') return;
    ['gp_access_token', 'gp_refresh_token', 'gp_user'].forEach(k => localStorage.removeItem(k));
  },
  currentUser: () => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('gp_user');
    return raw ? JSON.parse(raw) : null;
  },
};

// ─── Products ────────────────────────────────────────────────
export const productApi = {
  list: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null) as any);
    return apiFetch<{ items: any[]; total: number; pages: number }>(`/products?${q}`);
  },
  get: (slug: string) => apiFetch<any>(`/products/${slug}`),
  categories: () => apiFetch<any[]>('/products/categories'),
};

// ─── Cart ────────────────────────────────────────────────────
export const cartApi = {
  get: () => apiFetch<any>('/cart'),
  addItem: (productId: string, quantity = 1, variantId?: string) =>
    apiFetch('/cart/items', { method: 'POST', body: JSON.stringify({ productId, variantId, quantity }) }),
  updateItem: (itemId: string, quantity: number) =>
    apiFetch(`/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  removeItem: (itemId: string) => apiFetch(`/cart/items/${itemId}`, { method: 'DELETE' }),
  applyCoupon: (code: string) => apiFetch('/cart/coupon', { method: 'POST', body: JSON.stringify({ code }) }),
  removeCoupon: () => apiFetch('/cart/coupon', { method: 'DELETE' }),
};

// ─── Checkout ────────────────────────────────────────────────
export const checkoutApi = {
  quote: (params: any) => apiFetch('/checkout/quote', { method: 'POST', body: JSON.stringify(params) }),
  createOrder: (params: any) =>
    apiFetch<{ orderId: string; orderNumber: string; clientSecret: string; total: number }>('/checkout/order', {
      method: 'POST', body: JSON.stringify(params),
    }),
};

// ─── Orders ──────────────────────────────────────────────────
export const orderApi = {
  list: () => apiFetch<any[]>('/orders'),
  get: (id: string) => apiFetch<any>(`/orders/${id}`),
  invoice: (id: string) => apiFetch<Blob>(`/orders/${id}/invoice`),
};
