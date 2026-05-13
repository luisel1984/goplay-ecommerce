'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CheckCircle2, Package } from 'lucide-react';

export default function ConfirmationPage() {
  const params = useSearchParams();
  const locale = useLocale();
  const order = params.get('order');

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold">Merci pour votre commande !</h1>
      <p className="mt-2 text-slate-500">
        Votre commande <strong>{order}</strong> a été enregistrée. Un email de confirmation vous a été envoyé.
      </p>
      <div className="card p-6 mt-8 text-left">
        <h2 className="font-bold mb-3 flex items-center gap-2"><Package className="h-5 w-5 text-primary-600" />Prochaines étapes</h2>
        <ol className="space-y-2 text-sm text-slate-600">
          <li>1. Préparation de votre commande sous 24h</li>
          <li>2. Email avec numéro de suivi dès l'expédition</li>
          <li>3. Livraison sous 2-5 jours selon le mode choisi</li>
          <li>4. Facture disponible dans votre espace client</li>
        </ol>
      </div>
      <div className="mt-8 flex gap-3 justify-center">
        <Link href={`/${locale}/compte`} className="btn-primary">Suivre ma commande</Link>
        <Link href={`/${locale}/produits`} className="btn-secondary">Continuer mes achats</Link>
      </div>
    </div>
  );
}
