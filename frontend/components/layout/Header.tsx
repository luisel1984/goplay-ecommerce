'use client';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Search, ShoppingBag, Heart, User, Menu, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cartApi, authApi } from '@/lib/api';

export default function Header() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [count, setCount] = useState(0);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(authApi.currentUser());
    cartApi.get().then((c: any) => setCount(c.items?.length ?? 0)).catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur-xl">
      {/* Top banner */}
      <div className="bg-primary-600 text-center text-xs text-white py-2">
        ✨ Livraison offerte dès 50€ · Retour gratuit 14 jours · Service client français
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow">
              <span className="text-lg">⚡</span>
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-900">GoPlayElectronic</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400">High-tech français</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link href={`/${locale}/produits`} className="px-3 py-2 rounded-lg hover:bg-slate-50">{t('products')}</Link>
            <Link href={`/${locale}/produits?category=audio`} className="px-3 py-2 rounded-lg hover:bg-slate-50">Audio</Link>
            <Link href={`/${locale}/produits?category=electronique`} className="px-3 py-2 rounded-lg hover:bg-slate-50">Électronique</Link>
            <Link href={`/${locale}/produits?category=outillage`} className="px-3 py-2 rounded-lg hover:bg-slate-50">Outillage</Link>
          </nav>

          <div className="hidden lg:block flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input className="input pl-9" placeholder={tc('search')} />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="btn-ghost p-2" title="Langue">
              <Globe className="h-5 w-5" />
              <span className="text-xs uppercase">{locale}</span>
            </button>
            <Link href={`/${locale}/liste-souhaits`} className="btn-ghost p-2"><Heart className="h-5 w-5" /></Link>
            <Link href={`/${locale}/${user ? 'compte' : 'connexion'}`} className="btn-ghost p-2"><User className="h-5 w-5" /></Link>
            <Link href={`/${locale}/panier`} className="btn-ghost p-2 relative">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
