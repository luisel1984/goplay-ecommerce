/**
 * Cálculo de TVA française (VAT)
 *
 * Tipos de TVA en Francia (2026):
 *  - Standard:    20% (electrónica, ropa, audio…)
 *  - Intermédiaire: 10% (restauración, transportes, agro)
 *  - Réduit:        5.5% (alimentación, libros, energía)
 *  - Particulier:   2.1% (medicamentos, prensa)
 *
 * Para B2B intra-UE con n° TVA valide → 0% (autoliquidación)
 * Para fuera UE → 0% (exportación)
 */
export type VatRate = 20 | 10 | 5.5 | 2.1 | 0;

export const VAT_RATES = {
  STANDARD: 20 as VatRate,
  INTERMEDIATE: 10 as VatRate,
  REDUCED: 5.5 as VatRate,
  PARTICULAR: 2.1 as VatRate,
  EXEMPT: 0 as VatRate,
};

/**
 * Calcula HT (sin IVA) desde TTC (con IVA)
 * @param ttcCents importe TTC en céntimos
 * @param rate tipo de TVA (ej. 20)
 */
export function ttcToHt(ttcCents: number, rate: number): { htCents: number; vatCents: number } {
  const htCents = Math.round(ttcCents / (1 + rate / 100));
  return { htCents, vatCents: ttcCents - htCents };
}

/**
 * Calcula TTC desde HT
 */
export function htToTtc(htCents: number, rate: number): { ttcCents: number; vatCents: number } {
  const ttcCents = Math.round(htCents * (1 + rate / 100));
  return { ttcCents, vatCents: ttcCents - htCents };
}

/**
 * Códigos UE para autoliquidación intra-comunitaria
 */
const EU_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
  'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
]);

/**
 * Determina el tipo aplicable según país y si es B2B con número TVA validado.
 */
export function applicableVatRate(opts: {
  productRate: number;
  destinationCountry: string;
  buyerVatNumber?: string;
  buyerVatValidated?: boolean;
}): number {
  const { productRate, destinationCountry, buyerVatNumber, buyerVatValidated } = opts;
  const country = destinationCountry.toUpperCase();

  // Fuera de UE → exportación, 0%
  if (!EU_COUNTRIES.has(country)) return 0;

  // B2B intra-UE con TVA válido (no FR) → autoliquidación 0%
  if (country !== 'FR' && buyerVatNumber && buyerVatValidated) return 0;

  // Por defecto, aplicar el tipo del producto
  return productRate;
}

/**
 * Formato europeo: "12,50 €"
 */
export function formatEUR(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/**
 * Genera número de factura con secuencia anual: FAC-2026-00001
 */
export function nextInvoiceNumber(year: number, sequence: number): string {
  return `FAC-${year}-${String(sequence).padStart(5, '0')}`;
}
