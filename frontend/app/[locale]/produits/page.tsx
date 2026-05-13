'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { productApi } from '@/lib/api';
import ProductCard from '@/components/shop/ProductCard';
import { Filter } from 'lucide-react';

export default function ProductsPage() {
  const t = useTranslations('common');
  const params = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    productApi.list({
      category: params.get('category'),
      q: params.get('q'),
      sort, page, limit: 24,
    }).then((d) => {
      setProducts(d.items); setPages(d.pages);
    }).finally(() => setLoading(false));
  }, [params, sort, page]);

  const cat = params.get('category');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400">{cat ?? 'Catalogue'}</p>
          <h1 className="text-3xl font-bold text-slate-900">{cat ?? 'Tous les produits'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={sort} onChange={e => setSort(e.target.value)} className="input w-auto">
            <option value="recent">Plus récents</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="name">Nom</option>
          </select>
          <button className="btn-secondary">
            <Filter className="h-4 w-4" />Filtres
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="aspect-square bg-slate-100 rounded-lg" />
              <div className="h-4 bg-slate-100 rounded mt-4 w-3/4" />
              <div className="h-4 bg-slate-100 rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-slate-500">Aucun produit trouvé.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          {pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: pages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`h-9 w-9 rounded-lg text-sm font-semibold ${page === i + 1 ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
