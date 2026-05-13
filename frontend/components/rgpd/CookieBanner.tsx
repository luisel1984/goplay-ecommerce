'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'gp_cookie_consent_v1';

interface Consent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export default function CookieBanner() {
  const t = useTranslations('rgpd');
  const [show, setShow] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setShow(true);
  }, []);

  function save(consent: Consent) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    // Dispatch para herramientas analíticas
    window.dispatchEvent(new CustomEvent('cookie-consent-update', { detail: consent }));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-5xl card p-6 shadow-card border-2 border-primary-100">
        <div className="flex items-start gap-4">
          <div className="hidden sm:grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-600 flex-shrink-0">
            <Cookie className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900">{t('cookieTitle')}</h3>
            <p className="mt-1 text-sm text-slate-600">{t('cookieDesc')}</p>

            {customize && (
              <div className="mt-4 space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <input type="checkbox" checked disabled className="mt-1" />
                  <div>
                    <p className="font-medium text-sm">{t('necessary')}</p>
                    <p className="text-xs text-slate-500">{t('necessaryDesc')}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} className="mt-1" />
                  <div>
                    <p className="font-medium text-sm">{t('analytics')}</p>
                    <p className="text-xs text-slate-500">{t('analyticsDesc')}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="mt-1" />
                  <div>
                    <p className="font-medium text-sm">{t('marketing')}</p>
                    <p className="text-xs text-slate-500">{t('marketingDesc')}</p>
                  </div>
                </label>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => save({ necessary: true, analytics: true, marketing: true, timestamp: Date.now() })}
                className="btn-primary text-sm">{t('acceptAll')}</button>
              <button onClick={() => save({ necessary: true, analytics: false, marketing: false, timestamp: Date.now() })}
                className="btn-secondary text-sm">{t('rejectAll')}</button>
              {customize ? (
                <button onClick={() => save({ necessary: true, analytics, marketing, timestamp: Date.now() })}
                  className="btn-secondary text-sm">{t('savePrefs')}</button>
              ) : (
                <button onClick={() => setCustomize(true)} className="btn-ghost text-sm">{t('customize')}</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
