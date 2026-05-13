import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieBanner from '@/components/rgpd/CookieBanner';
import Providers from '@/components/Providers';

export function generateStaticParams() {
  return locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children, params,
}: { children: React.ReactNode; params: { locale: string } }) {
  if (!locales.includes(params.locale as Locale)) notFound();
  setRequestLocale(params.locale);
  const messages = await getMessages();

  return (
    <html lang={params.locale}>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages} locale={params.locale}>
          <Providers>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieBanner />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
