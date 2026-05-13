'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ShoppingBag, Heart, Truck, Shield, Star } from 'lucide-react';
import { productApi, cartApi } from '@/lib/api';
import { formatEUR } from '@/lib/utils';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const t = useTranslations('product');
  const tc = useTranslations('common');
  const [product, setProduct] = useState<any>(null);
  const [variant, setVariant] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => { productApi.get(params.slug).then(setProduct); }, [params.slug]);

  if (!product) return <div className="p-12 text-center">{tc('loading')}</div>;

  async function addToCart() {
    setAdding(true);
    try {
      await cartApi.addItem(product.id, qty, variant);
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } finally { setAdding(false); }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square relative rounded-2xl bg-slate-50 overflow-hidden card">
            {product.images?.[imgIdx] && (
              <Image src={product.images[imgIdx].url} alt={product.name} fill className="object-cover" />
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images.map((img: any, i: number) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 ${imgIdx === i ? 'border-primary-500' : 'border-transparent'}`}>
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{product.brand}</p>}
          <h1 className="mt-1 text-3xl font-bold text-slate-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div>
            <span className="text-sm text-slate-500">{product.reviews?.length ?? 0} avis</span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-900">{formatEUR(product.price)}</span>
            {product.compareAt && (
              <span className="text-lg text-slate-400 line-through">{formatEUR(product.compareAt)}</span>
            )}
            <span className="text-xs text-slate-500 ml-2">{t('vatIncluded')} ({product.vatRate}%)</span>
          </div>

          <p className="mt-2 text-sm">
            {product.inStock
              ? <span className="text-emerald-600 font-medium">✓ {tc('inStock')} · {product.stock} disponibles</span>
              : <span className="text-rose-600 font-medium">{tc('outOfStock')}</span>}
          </p>

          {product.variants?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold mb-2">Variante</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button key={v.id} onClick={() => setVariant(v.id)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-medium ${variant === v.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200'}`}>
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quantité</label>
              <div className="flex items-center border-2 border-slate-200 rounded-xl">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-slate-500 hover:bg-slate-50">−</button>
                <span className="px-4 font-semibold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-slate-500 hover:bg-slate-50">+</button>
              </div>
            </div>
            <button onClick={addToCart} disabled={!product.inStock || adding} className="btn-primary flex-1 py-3">
              <ShoppingBag className="h-5 w-5" />
              {adding ? '...' : tc('addToCart')}
            </button>
            <button className="btn-secondary p-3"><Heart className="h-5 w-5" /></button>
          </div>

          {/* Trust */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50">
              <Truck className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">Livraison rapide</p>
                <p className="text-xs text-slate-500">Colissimo 2-3 jours</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50">
              <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold">Garantie 2 ans</p>
                <p className="text-xs text-slate-500">SAV en français</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-10 prose prose-sm max-w-none">
            <h3 className="text-lg font-bold text-slate-900">{t('description')}</h3>
            <p className="text-slate-600 whitespace-pre-line">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
