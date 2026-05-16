export const VAT_RATES = {
    STANDARD: 20,
    INTERMEDIATE: 10,
    REDUCED: 5.5,
    PARTICULAR: 2.1,
    EXEMPT: 0,
};
/**
 * Calcula HT (sin IVA) desde TTC (con IVA)
 * @param ttcCents importe TTC en céntimos
 * @param rate tipo de TVA (ej. 20)
 */
export function ttcToHt(ttcCents, rate) {
    const htCents = Math.round(ttcCents / (1 + rate / 100));
    return { htCents, vatCents: ttcCents - htCents };
}
/**
 * Calcula TTC desde HT
 */
export function htToTtc(htCents, rate) {
    const ttcCents = Math.round(htCents * (1 + rate / 100));
    return { ttcCents, vatCents: ttcCents - htCents };
}
/**
 * Códigos UE para autoliquidación intra-comunitaria
 */
const EU_COUNTRIES = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
    'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);
/**
 * Determina el tipo aplicable según país y si es B2B con número TVA validado.
 */
export function applicableVatRate(opts) {
    const { productRate, destinationCountry, buyerVatNumber, buyerVatValidated } = opts;
    const country = destinationCountry.toUpperCase();
    // Fuera de UE → exportación, 0%
    if (!EU_COUNTRIES.has(country))
        return 0;
    // B2B intra-UE con TVA válido (no FR) → autoliquidación 0%
    if (country !== 'FR' && buyerVatNumber && buyerVatValidated)
        return 0;
    // Por defecto, aplicar el tipo del producto
    return productRate;
}
/**
 * Formato europeo: "12,50 €"
 */
export function formatEUR(cents) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
/**
 * Genera número de factura con secuencia anual: FAC-2026-00001
 */
export function nextInvoiceNumber(year, sequence) {
    return `FAC-${year}-${String(sequence).padStart(5, '0')}`;
}
