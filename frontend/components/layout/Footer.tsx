'use client';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 bg-white mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <p className="font-bold text-lg">⚡ GoPlayElectronic</p>
            <p className="mt-2 text-sm text-slate-500">High-tech français · Livraison rapide · Service client en français</p>
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2">{t('newsletter')}</p>
              <p className="text-xs text-slate-500 mb-2">{t('newsletterDesc')}</p>
              <div className="flex gap-2">
                <input type="email" className="input flex-1" placeholder="email@example.fr" />
                <button className="btn-primary">{t('subscribe')}</button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm">{t('company')}</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href={`/${locale}/a-propos`} className="hover:text-primary-600">{t('about')}</Link></li>
              <li><Link href={`/${locale}/contact`} className="hover:text-primary-600">{t('contact')}</Link></li>
              <li><Link href={`/${locale}/blog`} className="hover:text-primary-600">{t('blog')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t('help')}</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href={`/${locale}/livraison`} className="hover:text-primary-600">{t('shipping')}</Link></li>
              <li><Link href={`/${locale}/retours`} className="hover:text-primary-600">{t('returns')}</Link></li>
              <li><Link href={`/${locale}/faq`} className="hover:text-primary-600">{t('faq')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">{t('legal')}</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href={`/${locale}/cgv`} className="hover:text-primary-600">{t('cgv')}</Link></li>
              <li><Link href={`/${locale}/mentions-legales`} className="hover:text-primary-600">{t('mentions')}</Link></li>
              <li><Link href={`/${locale}/politique-confidentialite`} className="hover:text-primary-600">{t('privacy')}</Link></li>
              <li><Link href={`/${locale}/cookies`} className="hover:text-primary-600">{t('cookies')}</Link></li>
              <li><Link href={`/${locale}/mediateur`} className="hover:text-primary-600 text-xs">{t('mediator')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {year} GoPlayElectronic SAS · {t('rights')} · SIRET 000 000 000 00000 · TVA FR00000000000</p>
          <div className="flex gap-3">
            <span>💳 Visa</span><span>💳 MC</span><span>💶 SEPA</span>
            <span>🍎 Apple Pay</span><span>📦 Colissimo</span><span>📫 Mondial Relay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
