'use client';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, Package, MapPin, Truck } from 'lucide-react';
import { getStripe } from '@/lib/stripe';
import { cartApi, checkoutApi } from '@/lib/api';
import { formatEUR } from '@/lib/utils';

const stripePromise = getStripe();

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [cart, setCart] = useState<any>(null);
  const [shippingMethod, setShippingMethod] = useState('colissimo');
  const [shippingCost, setShippingCost] = useState(455);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [clientSecret, setClientSecret] = useState<string>();
  const [orderNumber, setOrderNumber] = useState<string>();

  const [form, setForm] = useState({
    email: '', fullName: '', line1: '', line2: '',
    postalCode: '', city: '', country: 'FR', phone: '', termsAccepted: false,
  });

  useEffect(() => { cartApi.get().then(setCart); }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function placeOrder() {
    if (!cart || !form.termsAccepted) return;
    const order = await checkoutApi.createOrder({
      cartId: cart.id, email: form.email,
      shippingAddress: { fullName: form.fullName, line1: form.line1, line2: form.line2, postalCode: form.postalCode, city: form.city, country: form.country, phone: form.phone },
      shippingMethod, shippingCents: shippingCost,
    });
    setClientSecret(order.clientSecret);
    setOrderNumber(order.orderNumber);
    setStep('payment');
  }

  if (!cart) return <div className="p-12 text-center">…</div>;
  if (!cart.items?.length) return <div className="p-12 text-center">Panier vide</div>;

  if (step === 'payment' && clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret, locale: 'fr', appearance: { theme: 'stripe', variables: { colorPrimary: '#4f46e5' } } }}>
        <div className="mx-auto max-w-2xl px-4 py-10">
          <div className="card p-8">
            <h2 className="font-bold text-xl mb-2">{t('payment')}</h2>
            <p className="text-sm text-slate-500 mb-1">Commande {orderNumber}</p>
            <p className="text-sm text-slate-500 mb-6">{t('secureCheckout')}</p>
            <PaymentForm orderNumber={orderNumber!} />
          </div>
        </div>
      </Elements>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <div className="card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-primary-600" />{t('contact')}</h2>
            <input type="email" required className="input" placeholder={t('email')} value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          {/* Shipping address */}
          <div className="card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary-600" />{t('shippingAddress')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <input className="input col-span-2" placeholder={t('fullName')} value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              <input className="input col-span-2" placeholder={t('address')} value={form.line1} onChange={e => set('line1', e.target.value)} />
              <input className="input col-span-2" placeholder={t('addressLine2')} value={form.line2} onChange={e => set('line2', e.target.value)} />
              <input className="input" placeholder={t('postalCode')} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} />
              <input className="input" placeholder={t('city')} value={form.city} onChange={e => set('city', e.target.value)} />
              <select className="input" value={form.country} onChange={e => set('country', e.target.value)}>
                <option value="FR">🇫🇷 France</option><option value="BE">🇧🇪 Belgique</option>
                <option value="LU">🇱🇺 Luxembourg</option><option value="ES">🇪🇸 Espagne</option>
                <option value="DE">🇩🇪 Allemagne</option>
              </select>
              <input className="input" placeholder={t('phone')} value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          {/* Shipping method */}
          <div className="card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Truck className="h-5 w-5 text-primary-600" />{t('shippingMethod')}</h2>
            <div className="space-y-2">
              {[
                { id: 'mondial-relay', label: '📫 Mondial Relay', desc: 'Point relais · 3-5 jours', price: 320 },
                { id: 'colissimo', label: '📦 Colissimo Domicile', desc: 'Livraison à domicile · 2-3 jours', price: 455 },
                { id: 'chronopost', label: '⚡ Chronopost J+1', desc: 'Express · livré demain', price: 890 },
              ].map(m => (
                <label key={m.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${shippingMethod === m.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200'}`}>
                  <input type="radio" checked={shippingMethod === m.id} onChange={() => { setShippingMethod(m.id); setShippingCost(m.price); }} />
                  <div className="flex-1">
                    <p className="font-semibold">{m.label}</p>
                    <p className="text-xs text-slate-500">{m.desc}</p>
                  </div>
                  <p className="font-bold">{formatEUR(m.price / 100)}</p>
                </label>
              ))}
            </div>
          </div>
          {/* Terms */}
          <label className="flex items-start gap-3 p-4 card">
            <input type="checkbox" checked={form.termsAccepted} onChange={e => set('termsAccepted', e.target.checked)} className="mt-1" />
            <span className="text-sm text-slate-600">{t('agreeTerms')}</span>
          </label>
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-24">
          <h3 className="font-bold mb-4">Récapitulatif</h3>
          <div className="space-y-3 mb-4">
            {cart.items.map((i: any) => (
              <div key={i.id} className="flex gap-3 text-sm">
                <span className="bg-slate-100 rounded-md w-6 h-6 grid place-items-center text-xs font-bold">{i.quantity}</span>
                <span className="flex-1 truncate">{i.name}</span>
                <span className="font-semibold">{formatEUR(i.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-sm border-t pt-3">
            <div className="flex justify-between"><span className="text-slate-500">Sous-total</span><span>{formatEUR(cart.subtotal)}</span></div>
            {cart.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Remise</span><span>−{formatEUR(cart.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-slate-500">Livraison</span><span>{formatEUR(shippingCost / 100)}</span></div>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-baseline">
            <span className="font-bold">Total TTC</span>
            <span className="text-2xl font-extrabold text-primary-600">{formatEUR((cart.total + shippingCost / 100))}</span>
          </div>
          <button onClick={placeOrder} disabled={!form.termsAccepted || !form.email || !form.fullName} className="btn-primary w-full mt-6 py-3">
            <Lock className="h-4 w-4" />Continuer vers le paiement
          </button>
          <p className="text-xs text-slate-400 text-center mt-3">{t('secureCheckout')}</p>
        </div>
      </div>
    </div>
  );
}

function PaymentForm({ orderNumber }: { orderNumber: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true); setError(undefined);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/fr/commande/confirmation?order=${orderNumber}` },
    });
    if (error) setError(error.message);
    setSubmitting(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-rose-600 text-sm">{error}</p>}
      <button type="submit" disabled={!stripe || submitting} className="btn-primary w-full py-3">
        <Lock className="h-4 w-4" />{submitting ? 'Traitement…' : 'Payer maintenant'}
      </button>
    </form>
  );
}
