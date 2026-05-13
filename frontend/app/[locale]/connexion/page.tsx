'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Lock, Mail } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(undefined);
    try {
      const res = await authApi.login(email, password);
      authApi.storeToken(res.accessToken, res.refreshToken, res.user);
      router.push(`/${locale}/compte`);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-center">{t('loginTitle')}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="email" required className="input pl-9" placeholder={t('email')} value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="password" required className="input pl-9" placeholder={t('password')} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? '…' : t('loginTitle')}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-500">
          {t('noAccount')} <Link href={`/${locale}/inscription`} className="text-primary-600 font-semibold">{t('createAccount')}</Link>
        </div>
      </div>
    </div>
  );
}
