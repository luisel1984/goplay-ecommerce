import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Truck, RotateCcw, Lock, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/shop/ProductCard';

async function getFeaturedProducts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/products?limit=8`, { next: { revalidate: 60 } });
    const data = await res.json();
    return data.items ?? [];
  } catch { return []; }
}

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const products = await getFeaturedProducts();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-500/5 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 text-primary-700 px-3 py-1 text-xs font-semibold">
              ⚡ Nouveau · Marques vérifiées
            </span>
            <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
              {t('heroTitle')}
            </h1>
            <p className="mt-4 text-lg text-slate-600 max-w-xl">{t('heroSubtitle')}</p>
            <div className="mt-8 flex gap-3">
              <Link href={`/${locale}/produits`} className="btn-primary">
                {t('heroCta')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`/${locale}/produits?category=audio`} className="btn-secondary">Audio</Link>
            </div>
          </div>
          <div className="relative aspect-square hidden lg:block">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 opacity-10 blur-3xl"></div>
            <div className="relative h-full w-full rounded-3xl bg-gradient-to-br from-white to-primary-50 shadow-card grid place-items-center text-9xl">
              ⚡
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-12 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid sm:grid-cols-3 gap-6">
          {[
            { icon: Truck, title: t('trustShipping'), desc: t('trustShippingDesc'), color: 'text-primary-600 bg-primary-50' },
            { icon: RotateCcw, title: t('trustReturns'), desc: t('trustReturnsDesc'), color: 'text-emerald-600 bg-emerald-50' },
            { icon: Lock, title: t('trustSecure'), desc: t('trustSecureDesc'), color: 'text-amber-600 bg-amber-50' },
          ].map((b, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${b.color}`}>
                <b.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{b.title}</h3>
                <p className="text-sm text-slate-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{t('featuredProducts')}</h2>
              <p className="mt-1 text-sm text-slate-500">Sélection de nos meilleures ventes</p>
            </div>
            <Link href={`/${locale}/produits`} className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">{t('shopByCategory')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { slug: 'audio', name: 'Audio & Casques', emoji: '🎧', color: 'from-purple-500 to-pink-500' },
              { slug: 'electronique', name: 'Électronique', emoji: '💻', color: 'from-blue-500 to-cyan-500' },
              { slug: 'outillage', name: 'Outillage', emoji: '🔧', color: 'from-orange-500 to-red-500' },
            ].map(c => (
              <Link key={c.slug} href={`/${locale}/produits?category=${c.slug}`}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-8 text-white shadow-card transition hover:-translate-y-1`}>
                <div className="absolute -right-4 -top-4 text-9xl opacity-20">{c.emoji}</div>
                <p className="text-sm uppercase tracking-wider opacity-80">Catégorie</p>
                <h3 className="mt-1 text-2xl font-bold">{c.name}</h3>
                <p className="mt-3 text-sm opacity-90 inline-flex items-center gap-1">
                  Découvrir <ArrowRight className="h-4 w-4" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
