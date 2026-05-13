'use client';
import { useState } from 'react';
import { Search, Download, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatEUR } from '@/lib/utils';

export default function DropshippingPage() {
  const [source, setSource] = useState<'ALIEXPRESS' | 'CJDROPSHIPPING'>('ALIEXPRESS');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string>();
  const [markup, setMarkup] = useState(150);

  async function search() {
    setLoading(true);
    try { setResults(await apiFetch(`/dropship/search?source=${source}&q=${encodeURIComponent(query)}`)); }
    finally { setLoading(false); }
  }

  async function importProduct(externalId: string) {
    setImporting(externalId);
    try {
      await apiFetch('/dropship/import', { method: 'POST', body: JSON.stringify({ source, externalId, markupPercent: markup }) });
      alert('Produit importé !');
    } finally { setImporting(undefined); }
  }

  async function syncStock() {
    await apiFetch('/dropship/sync-stock', { method: 'POST' });
    alert('Stocks synchronisés');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Dropshipping</p>
          <h1 className="text-3xl font-bold">Importer des produits</h1>
        </div>
        <button onClick={syncStock} className="btn-secondary"><RefreshCw className="h-4 w-4" />Sync stocks</button>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex gap-3">
          <select value={source} onChange={e => setSource(e.target.value as any)} className="input w-auto">
            <option value="ALIEXPRESS">🛒 AliExpress</option>
            <option value="CJDROPSHIPPING">📦 CJDropshipping</option>
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="input pl-9" placeholder="Mots-clés (ex: powerbank, écouteurs, smartwatch)" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Markup %</label>
            <input type="number" value={markup} onChange={e => setMarkup(+e.target.value)} className="input w-24" />
          </div>
          <button onClick={search} disabled={loading} className="btn-primary self-end">{loading ? '…' : 'Rechercher'}</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {results.map(p => (
          <div key={p.externalId} className="card p-4">
            <div className="aspect-square rounded-lg bg-slate-100 mb-3 overflow-hidden">
              {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover" />}
            </div>
            <p className="text-xs text-slate-500">{p.brand}</p>
            <h3 className="font-semibold text-sm line-clamp-2">{p.name}</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-lg font-bold">{formatEUR(p.costCents / 100)}</span>
              <span className="text-xs text-slate-400">coût</span>
            </div>
            <p className="text-xs text-emerald-600">→ Vendre {formatEUR(p.costCents * (1 + markup/100) / 100)}</p>
            <button onClick={() => importProduct(p.externalId)} disabled={importing === p.externalId}
              className="btn-primary w-full mt-3 text-sm">
              <Download className="h-4 w-4" />{importing === p.externalId ? '…' : 'Importer'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
