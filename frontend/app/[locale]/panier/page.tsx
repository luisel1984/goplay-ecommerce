'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Trash2, Tag } from 'lucide-react';
import { cartApi } from '@/lib/api';
import { formatEUR } from '@/lib/utils';

export default function CartPage() {
  const t = useTranslations('cart');
  const locale = useLocale();
  const [cart, setCart] = useState<any>(null);
  const [coupon, setCoupon] = useState('');

  useEffect(() => { cartApi.get().then(setCart); }, []);

  async function update(id: string, q: number) {
    const c = await cartApi.updateItem(id, q);
    setCart(c);
  }
  async function remove(id: string) {
    const c = await cartApi.removeItem(id);
    setCart(c);
  }
  async function applyCoupon() {
    try { await cartApi.applyCoupon(coupon); setCart(await cartApi.get()); } catch {}
  }

  if (!cart) return <div className="p-12 text-center">…</div>;

  if (!cart.items?.length) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="text-6xl">🛍️</div>
        <h1 className="mt-4 text-2xl font-bold">{t('empty')}</h1>
        <p className="mt-2 text-slate-500">{t('emptyDesc')}</p>
        <Link href={`/${locale}/produits`} className="btn-primary mt-6">{t('shopNow')}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item: any) => (
            <div key={item.id} className="card p-4 flex gap-4 items-center">
              <div className="relative h-20 w-20 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/${locale}/produits/${item.slug}`} className="font-semibold hover:text-primary-600">{item.name}</Link>
                {item.variant && <p className="text-sm text-slate-500">{item.variant}</p>}
                <p className="text-sm font-bold mt-1">{formatEUR(item.unitPrice)}</p>
              </div>
              <div className="flex items-center border-2 border-slate-200 rounded-lg">
                <button onClick={() => update(item.id, item.quantity - 1)} className="px-3 py-1.5 hover:bg-slate-50">−</button>
                <span className="px-3 font-semibold w-8 text-center">{item.quantity}</span>
                <button onClick={() => update(item.id, item.quantity + 1)} className="px-3 py-1.5 hover:bg-slate-50">+</button>
              </div>
              <p className="font-bold w-20 text-right">{formatEUR(item.subtotal)}</p>
              <button onClick={() => remove(item.id)} className="text-rose-400 hover:text-rose-600 p-2">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-24">
          <h3 className="font-bold text-lg mb-4">Résumé</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">{t('subtotal')}</span><span className="font-semibold">{formatEUR(cart.subtotal)}</span></div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-emerald-600"><span>{t('discount')} ({cart.coupon?.code})</span><span className="font-semibold">−{formatEUR(cart.discount)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-slate-500">{t('shipping')}</span><span className="text-slate-400 text-xs">Calculé à l'étape suivante</span></div>
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between items-baseline">
            <span className="font-bold">{t('total')}</span>
            <span className="text-2xl font-extrabold text-primary-600">{formatEUR(cart.total)}</span>
          </div>

          {!cart.coupon && (
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input className="input pl-9 text-sm" placeholder={t('couponCode')} value={coupon} onChange={e => setCoupon(e.target.value)} />
              </div>
              <button onClick={applyCoupon} className="btn-secondary text-sm">{t('applyCoupon')}</button>
            </div>
          )}

          <Link href={`/${locale}/commande`} className="btn-primary w-full mt-6 py-3">{t('checkout')}</Link>
          <Link href={`/${locale}/produits`} className="btn-ghost w-full mt-2 text-sm">{t('continueShopping')}</Link>
        </div>
      </div>
    </div>
  );
}
