'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Package, MapPin, Shield, FileDown, LogOut } from 'lucide-react';
import { authApi, orderApi } from '@/lib/api';
import { formatEUR, formatDate } from '@/lib/utils';

export default function AccountPage() {
  const t = useTranslations('account');
  const router = useRouter();
  const locale = useLocale();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const u = authApi.currentUser();
    if (!u) { router.push(`/${locale}/connexion`); return; }
    setUser(u);
    orderApi.list().then(setOrders).catch(() => {});
  }, []);

  async function downloadInvoice(orderId: string, number: string) {
    const blob = await orderApi.invoice(orderId);
    const url = URL.createObjectURL(blob as any);
    const a = document.createElement('a');
    a.href = url; a.download = `${number}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  function logout() {
    const rt = localStorage.getItem('gp_refresh_token');
    if (rt) authApi.logout(rt).catch(() => {});
    authApi.clearToken();
    router.push(`/${locale}`);
  }

  if (!user) return <div className="p-12 text-center">…</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="card p-4 h-fit">
          <div className="p-4 text-center border-b">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white text-xl font-bold mx-auto">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <p className="mt-3 font-semibold">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
          <nav className="mt-3 space-y-1 text-sm">
            <a className="flex items-center gap-2 p-2 rounded-lg bg-primary-50 text-primary-700 font-semibold"><Package className="h-4 w-4" />{t('myOrders')}</a>
            <a className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50"><MapPin className="h-4 w-4" />{t('addresses')}</a>
            <a className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50"><Shield className="h-4 w-4" />{t('rgpd')}</a>
            <button onClick={logout} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-rose-50 text-rose-600">
              <LogOut className="h-4 w-4" />Déconnexion
            </button>
          </nav>
        </aside>

        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold mb-6">{t('myOrders')}</h1>
          {orders.length === 0 ? (
            <div className="card p-12 text-center text-slate-500">Aucune commande pour le moment</div>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold">{o.number}</p>
                      <p className="text-xs text-slate-500">{formatDate(o.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatEUR(o.total)}</p>
                      <span className="badge inline-block text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 mt-1">{o.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500 mb-3">
                    {o.items.slice(0, 3).map((i: any, idx: number) => (
                      <span key={idx}>{i.quantity}× {i.name}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {o.paymentStatus === 'CAPTURED' && (
                      <button onClick={() => downloadInvoice(o.id, o.number)} className="btn-secondary text-sm">
                        <FileDown className="h-4 w-4" />{t('downloadInvoice')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
