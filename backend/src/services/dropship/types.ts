/**
 * Tipos compartidos por todos los adapters dropshipping.
 * Permite sustituir AliExpress / CJ / Alibaba sin tocar la lógica core.
 */
export interface DropshipProduct {
  externalId: string;
  externalUrl: string;
  name: string;
  description: string;
  brand?: string;
  category?: string;
  costCents: number;        // Precio para el seller
  suggestedPriceCents: number;
  stock: number;
  weightGrams?: number;
  images: string[];
  variants?: DropshipVariant[];
  shippingDays?: { min: number; max: number };
}

export interface DropshipVariant {
  externalId: string;
  name: string;
  attributes: Record<string, string>;
  costCents: number;
  stock: number;
  imageUrl?: string;
}

export interface DropshipOrderRequest {
  externalProductId: string;
  variantId?: string;
  quantity: number;
  recipient: {
    fullName: string;
    line1: string;
    line2?: string;
    postalCode: string;
    city: string;
    country: string;
    phone?: string;
    email?: string;
  };
  shippingMethod?: string;
  notes?: string;
}

export interface DropshipOrderResponse {
  externalOrderId: string;
  status: 'placed' | 'pending' | 'failed';
  totalCents: number;
  estimatedShippingDate?: string;
  trackingNumber?: string;
  carrier?: string;
  raw?: unknown;
}

export interface DropshipAdapter {
  source: 'ALIEXPRESS' | 'CJDROPSHIPPING' | 'ALIBABA';
  searchProducts(query: string, page?: number): Promise<DropshipProduct[]>;
  getProduct(externalId: string): Promise<DropshipProduct>;
  syncStock(externalIds: string[]): Promise<Map<string, { stock: number; costCents: number }>>;
  placeOrder(req: DropshipOrderRequest): Promise<DropshipOrderResponse>;
  getOrderStatus(externalOrderId: string): Promise<{ status: string; trackingNumber?: string; carrier?: string }>;
}
