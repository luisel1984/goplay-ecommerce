'use client';
import { useEffect, useState } from 'react';
import { Euro, ShoppingBag, Users, AlertTriangle, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatEUR } from '@/lib/utils';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiFetch('/admin/dashboard').then(setData).catch(() => {}); }, []);

  if (!data) return <p>Chargement…</p>;

  const kpis = [
    { label: 'Revenu du mois', value: formatEUR(data.monthRevenue), icon: Euro, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Commandes payées', value: data.paidOrders, icon: ShoppingBag, color: 'from-primary-500 to-primary-700' },
    { label: 'Clients', value: data.customers, icon: Users, color: 'from-violet-500 to-violet-700' },
    { label: 'En attente', value: data.pending, icon: Clock, color: 'from-amber-500 to-amber-700' },
    { label: 'Stock bas', value: data.lowStock, icon: AlertTriangle, color: 'from-rose-500 to-rose-700' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">GoPlayElectronic</p>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`rounded-2xl p-5 text-white bg-gradient-to-br ${k.color} shadow-card`}>
            <div className="flex items-center justify-between mb-3">
              <k.icon className="h-5 w-5 opacity-80" />
            </div>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs opacity-80 mt-1">{k.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
