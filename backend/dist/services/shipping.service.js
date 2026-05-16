import crypto from 'node:crypto';
import xml2js from 'xml2js';
import { env } from '../config/env.js';
export async function createColissimoLabel(input) {
    if (!env.COLISSIMO_CONTRACT_NUMBER || !env.COLISSIMO_PASSWORD) {
        // Mock para desarrollo
        return {
            labelPdfBase64: '',
            trackingNumber: 'MOCK' + Date.now(),
            trackingUrl: 'https://www.laposte.fr/outils/suivre-vos-envois?code=MOCK' + Date.now(),
            carrier: 'Colissimo (mock)',
        };
    }
    const payload = {
        contractNumber: env.COLISSIMO_CONTRACT_NUMBER,
        password: env.COLISSIMO_PASSWORD,
        outputFormat: { x: 0, y: 0, outputPrintingType: 'PDF_A4_300dpi' },
        letter: {
            service: { productCode: input.productCode ?? 'DOM', depositDate: new Date().toISOString().slice(0, 10), orderNumber: input.orderNumber },
            parcel: { weight: (input.weightGrams / 1000).toFixed(2) },
            addressee: {
                addresseeParcelRef: input.orderNumber,
                address: {
                    lastName: input.recipient.fullName, line2: input.recipient.line1, line3: input.recipient.line2,
                    countryCode: input.recipient.country, city: input.recipient.city, zipCode: input.recipient.postalCode,
                    email: input.recipient.email, mobileNumber: input.recipient.phone,
                },
            },
        },
    };
    const res = await fetch('https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/2.0/generateLabel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'multipart/mixed' },
        body: JSON.stringify(payload),
    });
    if (!res.ok)
        throw new Error(`Colissimo API: ${res.status}`);
    const json = await res.json();
    const trackingNumber = json.labelV2Response?.parcelNumber;
    return {
        labelPdfBase64: json.labelV2Response?.label ?? '',
        trackingNumber,
        trackingUrl: `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
        carrier: 'Colissimo',
    };
}
/**
 * Busca puntos relais cerca de un código postal
 */
export async function findMondialRelayPoints(postalCode, country = 'FR', limit = 7) {
    const params = {
        Enseigne: env.MONDIALRELAY_BRAND_ID,
        Pays: country,
        CP: postalCode,
        NombreResultats: String(limit),
    };
    const security = signMondialRelay(params);
    const xmlBody = buildSoapEnvelope('WSI4_PointRelais_Recherche', { ...params, Security: security });
    if (!env.COLISSIMO_CONTRACT_NUMBER /* dev mode */) {
        return [
            { id: '012345', name: 'Tabac de la Mairie', line1: '5 Place du Marché', postalCode, city: 'Saint-Pourçain', country: 'FR', distanceKm: 0.3, openingHours: 'Lun-Sam 8h-19h' },
            { id: '012346', name: 'Carrefour Express', line1: '12 Rue de Paris', postalCode, city: 'Saint-Pourçain', country: 'FR', distanceKm: 0.8, openingHours: 'Tous les jours 8h-22h' },
        ];
    }
    const res = await fetch('https://api.mondialrelay.com/Web_Services.asmx', {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: 'http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche' },
        body: xmlBody,
    });
    const xml = await res.text();
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });
    const relays = parsed?.['soap:Envelope']?.['soap:Body']?.['WSI4_PointRelais_RechercheResponse']?.['WSI4_PointRelais_RechercheResult']?.['PointsRelais']?.['PointRelais_Details'] ?? [];
    const arr = Array.isArray(relays) ? relays : [relays];
    return arr.map((r) => ({
        id: r.Num,
        name: r.LgAdr1,
        line1: `${r.LgAdr3 ?? ''} ${r.LgAdr4 ?? ''}`.trim(),
        postalCode: r.CP,
        city: r.Ville,
        country: r.Pays,
        distanceKm: Number(r.Distance) / 1000,
    }));
}
function signMondialRelay(params) {
    const concat = Object.values(params).join('') + env.MONDIALRELAY_PRIVATE_KEY;
    return crypto.createHash('md5').update(concat).digest('hex').toUpperCase();
}
function buildSoapEnvelope(method, params) {
    const inner = Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join('');
    return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body><${method} xmlns="http://www.mondialrelay.fr/webservice/">${inner}</${method}></soap:Body>
</soap:Envelope>`;
}
export function getShippingQuotes(opts) {
    const { country, weightGrams, subtotalCents } = opts;
    const quotes = [];
    // Tarifas FR
    if (country === 'FR') {
        // Mondial Relay
        let mr = 320;
        if (weightGrams > 500)
            mr = 450;
        if (weightGrams > 2000)
            mr = 590;
        quotes.push({ method: 'mondial-relay', label: 'Mondial Relay (point relais)', priceCents: subtotalCents > 5000 ? 0 : mr, estimatedDays: '3-5 jours' });
        // Colissimo
        let coli = 455;
        if (weightGrams > 500)
            coli = 605;
        if (weightGrams > 1000)
            coli = 740;
        if (weightGrams > 2000)
            coli = 950;
        quotes.push({ method: 'colissimo', label: 'Colissimo Domicile', priceCents: coli, estimatedDays: '2-3 jours' });
        quotes.push({ method: 'chronopost', label: 'Chronopost J+1', priceCents: 890 + Math.floor(weightGrams / 100) * 5, estimatedDays: 'Livré demain' });
    }
    else {
        // UE / Internacional
        quotes.push({ method: 'colissimo', label: 'Colissimo International', priceCents: 1390 + Math.floor(weightGrams / 100) * 8, estimatedDays: '5-8 jours' });
    }
    return quotes;
}
