'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { LayoutDashboard, Package, ShoppingBag, Truck, Settings, Users } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    const u = authApi.currentUser();
    if (!u || !['ADMIN', 'STAFF'].includes(u.role)) router.push(`/${locale}/connexion`);
  }, []);

  const items = [
    { href: `/${locale}/admin`, icon: LayoutDashboard, label: 'Dashboard' },
    { href: `/${locale}/admin/produits`, icon: Package, label: 'Produits' },
    { href: `/${locale}/admin/commandes`, icon: ShoppingBag, label: 'Commandes' },
    { href: `/${locale}/admin/dropshipping`, icon: Truck, label: 'Dropshipping' },
    { href: `/${locale}/admin/clients`, icon: Users, label: 'Clients' },
    { href: `/${locale}/admin/parametres`, icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-white p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 p-3 mb-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">⚡</div>
          <div>
            <p className="font-bold text-sm">GoPlay Admin</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Backoffice</p>
          </div>
        </div>
        <nav className="space-y-1">
          {items.map(it => {
            const active = pathname === it.href;
            return (
              <Link key={it.href} href={it.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-primary-600/20 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
                <it.icon className="h-4 w-4" />{it.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
