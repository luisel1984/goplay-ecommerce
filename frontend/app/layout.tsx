import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'GoPlayElectronic — High-tech français', template: '%s | GoPlayElectronic' },
  description: 'Boutique française de produits high-tech: audio, mobile, outillage. Livraison rapide Colissimo & Mondial Relay.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://goplayelectronic.fr'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
