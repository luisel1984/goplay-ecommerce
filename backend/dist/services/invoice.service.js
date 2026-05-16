import PDFDocument from 'pdfkit';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { formatEUR, nextInvoiceNumber } from '../lib/vat.js';
/**
 * Genera factura PDF conforme a la legislación francesa.
 * Mentions obligatoires (art. 242 nonies A CGI):
 *  - N° de facture séquentiel
 *  - Date d'émission
 *  - Identité vendeur (raison sociale, adresse, SIRET, TVA intracommunautaire)
 *  - Identité acheteur
 *  - Désignation produits / quantités / prix unitaire HT
 *  - Total HT, TVA détaillée par taux, total TTC
 *  - Date d'exécution / livraison
 *  - Conditions de règlement
 */
export async function generateInvoicePDF(orderId) {
    const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: true, billingAddress: true, shippingAddress: true, user: true },
    });
    // Asignar invoiceNumber si no existe
    let invoiceNumber = order.invoiceNumber;
    if (!invoiceNumber) {
        const year = new Date().getFullYear();
        const count = await prisma.order.count({
            where: { invoiceIssuedAt: { gte: new Date(`${year}-01-01`) } },
        });
        invoiceNumber = nextInvoiceNumber(year, count + 1);
        await prisma.order.update({
            where: { id: order.id },
            data: { invoiceNumber, invoiceIssuedAt: new Date() },
        });
    }
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', (b) => buffers.push(b));
    const done = new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(buffers))));
    // ─── Header
    doc.fontSize(20).fillColor('#4f46e5').text(env.COMPANY_NAME, 50, 50);
    doc.fontSize(9).fillColor('#475569')
        .text(env.COMPANY_ADDRESS, 50, 75)
        .text(`SIRET: ${env.COMPANY_SIRET} · TVA: ${env.COMPANY_VAT}`, 50, 88)
        .text(`${env.COMPANY_EMAIL} · ${env.COMPANY_PHONE}`, 50, 101);
    doc.fontSize(18).fillColor('#0f172a').text('FACTURE', 400, 50, { align: 'right' });
    doc.fontSize(10).fillColor('#475569')
        .text(`N° ${invoiceNumber}`, 400, 75, { align: 'right' })
        .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 400, 90, { align: 'right' })
        .text(`Commande: ${order.number}`, 400, 105, { align: 'right' });
    // ─── Adresses
    const billing = order.billingAddress ?? order.shippingAddress;
    doc.fontSize(11).fillColor('#0f172a').text('Facturé à', 50, 150);
    doc.fontSize(9).fillColor('#334155').text(billing?.fullName ?? order.email, 50, 165)
        .text(billing?.line1 ?? '', 50, 178)
        .text(`${billing?.postalCode ?? ''} ${billing?.city ?? ''}`, 50, 191)
        .text(billing?.country ?? 'FR', 50, 204);
    if (order.shippingAddress && order.shippingAddress.id !== order.billingAddressId) {
        doc.fontSize(11).fillColor('#0f172a').text('Livré à', 320, 150);
        doc.fontSize(9).fillColor('#334155').text(order.shippingAddress.fullName, 320, 165)
            .text(order.shippingAddress.line1, 320, 178)
            .text(`${order.shippingAddress.postalCode} ${order.shippingAddress.city}`, 320, 191)
            .text(order.shippingAddress.country, 320, 204);
    }
    // ─── Items table
    let y = 250;
    doc.fontSize(9).fillColor('#fff').rect(50, y, 500, 22).fill('#4f46e5');
    doc.fillColor('#fff')
        .text('Désignation', 55, y + 7)
        .text('Qté', 320, y + 7, { width: 30, align: 'right' })
        .text('PU HT', 360, y + 7, { width: 60, align: 'right' })
        .text('TVA', 425, y + 7, { width: 35, align: 'right' })
        .text('Total TTC', 470, y + 7, { width: 75, align: 'right' });
    y += 28;
    for (const item of order.items) {
        const htUnit = item.unitPriceCents - Math.round(item.unitPriceCents * (Number(item.vatRate) / (100 + Number(item.vatRate))));
        doc.fontSize(9).fillColor('#0f172a').text(item.name, 55, y, { width: 260 })
            .text(String(item.quantity), 320, y, { width: 30, align: 'right' })
            .text(formatEUR(htUnit), 360, y, { width: 60, align: 'right' })
            .text(`${item.vatRate}%`, 425, y, { width: 35, align: 'right' })
            .text(formatEUR(item.totalCents), 470, y, { width: 75, align: 'right' });
        y += 22;
    }
    // ─── Totals
    y += 20;
    const totalsX = 360;
    const ht = order.subtotalCents - order.vatCents;
    doc.fontSize(10).fillColor('#475569')
        .text('Total HT:', totalsX, y).text(formatEUR(ht), 470, y, { width: 75, align: 'right' });
    y += 16;
    if (order.discountCents > 0) {
        doc.fillColor('#dc2626').text('Remise:', totalsX, y).text(`− ${formatEUR(order.discountCents)}`, 470, y, { width: 75, align: 'right' });
        y += 16;
    }
    doc.fillColor('#475569')
        .text('Frais de port:', totalsX, y).text(formatEUR(order.shippingCents), 470, y, { width: 75, align: 'right' });
    y += 16;
    doc.text(`TVA:`, totalsX, y).text(formatEUR(order.vatCents), 470, y, { width: 75, align: 'right' });
    y += 16;
    if (order.creditCents > 0) {
        doc.fillColor('#16a34a').text('Crédit appliqué:', totalsX, y).text(`− ${formatEUR(order.creditCents)}`, 470, y, { width: 75, align: 'right' });
        y += 16;
    }
    y += 6;
    doc.fontSize(13).fillColor('#0f172a').rect(totalsX - 10, y - 4, 195, 24).stroke('#4f46e5')
        .text('TOTAL TTC', totalsX, y + 2)
        .text(formatEUR(order.totalCents), 470, y + 2, { width: 75, align: 'right' });
    // ─── Mentions légales
    y = 720;
    doc.fontSize(7).fillColor('#94a3b8')
        .text('Conditions de règlement: paiement comptant à réception. En cas de retard de paiement, application d\'une indemnité forfaitaire de 40€ pour frais de recouvrement (art. L441-10 C. com.) et intérêts de retard égaux au taux BCE majoré de 10 points.', 50, y, { width: 500 })
        .text(`${env.COMPANY_NAME} · SIRET ${env.COMPANY_SIRET} · TVA ${env.COMPANY_VAT}`, 50, y + 30, { width: 500, align: 'center' });
    doc.end();
    const buffer = await done;
    return { buffer, invoiceNumber };
}
