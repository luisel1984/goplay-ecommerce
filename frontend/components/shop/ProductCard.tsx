'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatEUR } from '@/lib/utils';
import { cartApi } from '@/lib/api';
import { useState } from 'react';

interface Props {
  product: {
    id: string; slug: string; name: string; brand?: string;
    price: number; compareAt?: number | null;
    image?: string | null; inStock: boolean; stock: number;
    category?: { name: string };
  };
}

export default function ProductCard({ product }: Props) {
  const t = useTranslations('common');
  const locale = useLocale();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const discount = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  async function add(e: React.MouseEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await cartApi.addItem(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } finally { setAdding(false); }
  }

  return (
    <Link href={`/${locale}/produits/${product.slug}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-card">
      <div className="relative aspect-square bg-slate-50 overflow-hidden">
        {product.image && (
          <Image src={product.image} alt={product.name} fill sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
            className="object-cover transition group-hover:scale-105" />
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow">
            −{discount}%
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/70 grid place-items-center">
            <span className="text-sm font-bold text-slate-700">{t('outOfStock')}</span>
          </div>
        )}
        <button className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-400 shadow-soft transition hover:text-rose-500"
          onClick={(e) => e.preventDefault()}>
          <Heart className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4">
        {product.brand && <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{product.brand}</p>}
        <h3 className="mt-1 font-medium text-slate-900 line-clamp-2 leading-tight">{product.name}</h3>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900">{formatEUR(product.price)}</p>
            {product.compareAt && (
              <p className="text-xs text-slate-400 line-through">{formatEUR(product.compareAt)}</p>
            )}
          </div>
          <button onClick={add} disabled={!product.inStock || adding}
            className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white shadow-soft transition hover:bg-primary-700 disabled:opacity-40">
            <ShoppingBag className="h-4 w-4" />
          </button>
        </div>
        {added && <p className="mt-2 text-xs text-emerald-600">✓ {t('addToCart')}</p>}
      </div>
    </Link>
  );
}
