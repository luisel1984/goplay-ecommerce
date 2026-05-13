'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { authApi } from '@/lib/api';

export default function SignupPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const locale = useLocale();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '',
    rgpdAccepted: false, marketingOptIn: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.rgpdAccepted) { setError('Vous devez accepter la politique RGPD'); return; }
    setLoading(true); setError(undefined);
    try {
      const res: any = await authApi.signup({ ...form, locale });
      authApi.storeToken(res.accessToken, res.refreshToken, res.user);
      router.push(`/${locale}/compte`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-center">{t('signupTitle')}</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input required className="input" placeholder={t('firstName')} value={form.firstName} onChange={e => set('firstName', e.target.value)} />
            <input required className="input" placeholder={t('lastName')} value={form.lastName} onChange={e => set('lastName', e.target.value)} />
          </div>
          <input type="email" required className="input" placeholder={t('email')} value={form.email} onChange={e => set('email', e.target.value)} />
          <input type="password" required minLength={8} className="input" placeholder={t('password') + ' (8+ caractères)'} value={form.password} onChange={e => set('password', e.target.value)} />
          <label className="flex items-start gap-2 text-xs text-slate-600 mt-3">
            <input type="checkbox" required checked={form.rgpdAccepted} onChange={e => set('rgpdAccepted', e.target.checked)} className="mt-0.5" />
            <span>{t('rgpdAccept')}</span>
          </label>
          <label className="flex items-start gap-2 text-xs text-slate-600">
            <input type="checkbox" checked={form.marketingOptIn} onChange={e => set('marketingOptIn', e.target.checked)} className="mt-0.5" />
            <span>{t('marketingOptIn')}</span>
          </label>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-3">
            {loading ? '…' : t('createAccount')}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-500">
          {t('alreadyAccount')} <Link href={`/${locale}/connexion`} className="text-primary-600 font-semibold">{t('loginTitle')}</Link>
        </div>
      </div>
    </div>
  );
}
