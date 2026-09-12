/**
 * §41 PDF Invoice Requirements — every listed field is rendered.
 * Pure: takes InvoiceDocumentData, returns a Buffer. No I/O, no Knex.
 */
import PDFDocument from 'pdfkit';
import { formatEur, formatRatePercent } from '@fa/contracts';
import type { InvoiceDocumentData } from './invoice-document-data';
import { KLEINUNTERNEHMER_TEXT } from './invoice-document-data';

const fmtDate = (d: string | null) =>
  d
    ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(`${d}T00:00:00Z`))
    : '—';
const nz = (s: string | null | undefined) => s ?? '';

export function renderInvoicePdf(data: InvoiceDocumentData): Promise<Buffer> {
  const { invoice: inv, seller } = data;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: { Title: `Rechnung ${inv.invoiceNumber ?? ''}`, Author: seller.legalName },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const klein = seller.vatRegime === 'KLEINUNTERNEHMER';
    const sellerName = seller.businessName
      ? `${seller.businessName} · ${seller.legalName}`
      : seller.legalName;

    // Header — business legal name + address
    doc
      .fontSize(9)
      .fillColor('#555')
      .text(
        `${seller.legalName} · ${seller.address.street} · ${seller.address.postalCode} ${seller.address.city}`,
        50,
        40,
      );
    doc.fillColor('#000').fontSize(16).text(sellerName, 50, 60);
    doc
      .fontSize(9)
      .text(
        `${seller.address.street}\n${seller.address.postalCode} ${seller.address.city}\n${seller.address.country}`,
        50,
        82,
      );
    if (seller.email) doc.text(seller.email);
    if (seller.phone) doc.text(seller.phone);

    // Client name + address
    doc.fontSize(11).text(nz(inv.clientSnapshot.name), 50, 150);
    doc
      .fontSize(10)
      .text(
        `${nz(inv.clientSnapshot.street)}\n${nz(inv.clientSnapshot.postalCode)} ${nz(inv.clientSnapshot.city)}\n${nz(inv.clientSnapshot.country)}`,
      );
    if (inv.clientSnapshot.vatId) doc.text(`USt-IdNr.: ${inv.clientSnapshot.vatId}`);

    // Invoice number / dates
    const metaX = 360;
    doc.fontSize(10);
    doc.text(`Rechnungsnummer: ${inv.invoiceNumber ?? ''}`, metaX, 150);
    doc.text(`Rechnungsdatum: ${fmtDate(inv.issueDate)}`, metaX);
    doc.text(`Leistungsdatum: ${fmtDate(inv.serviceDate)}`, metaX);
    doc.text(`Fällig am: ${fmtDate(inv.dueDate)}`, metaX);

    doc.fontSize(18).text(`Rechnung ${inv.invoiceNumber ?? ''}`, 50, 240);

    // Lines table — description, quantity, unit price, net, VAT, gross
    let y = 280;
    const cols = { pos: 50, desc: 75, qty: 300, price: 370, vat: 440, net: 490 };
    doc.fontSize(9).fillColor('#555');
    doc
      .text('Pos.', cols.pos, y)
      .text('Beschreibung', cols.desc, y)
      .text('Menge', cols.qty, y, { width: 60, align: 'right' })
      .text('Einzelpreis', cols.price, y, { width: 60, align: 'right' })
      .text('USt', cols.vat, y, { width: 40, align: 'right' })
      .text('Netto', cols.net, y, { width: 60, align: 'right' });
    y += 14;
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#999').stroke();
    y += 6;
    doc.fillColor('#000').fontSize(10);
    for (const l of inv.lines) {
      const h = Math.max(doc.heightOfString(l.description, { width: 215 }), 12);
      doc.text(String(l.position), cols.pos, y);
      doc.text(l.description, cols.desc, y, { width: 215 });
      doc.text(`${l.quantity.replace(/\.?0+$/, '')} ${l.unit}`, cols.qty, y, {
        width: 60,
        align: 'right',
      });
      doc.text(formatEur(l.unitPrice), cols.price, y, { width: 60, align: 'right' });
      doc.text(
        l.taxTreatment === 'KLEINUNTERNEHMER_19' ? '§19' : formatRatePercent(l.taxRate),
        cols.vat,
        y,
        { width: 40, align: 'right' },
      );
      doc.text(formatEur(l.netAmount), cols.net, y, { width: 60, align: 'right' });
      y += h + 6;
    }
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#999').stroke();
    y += 10;

    // Totals — net, VAT, gross
    const totalX = 380;
    doc
      .text('Nettobetrag', totalX, y, { width: 100 })
      .text(formatEur(inv.subtotalNet), 490, y, { width: 60, align: 'right' });
    y += 14;
    if (!klein) {
      doc
        .text('Umsatzsteuer', totalX, y, { width: 100 })
        .text(formatEur(inv.taxTotal), 490, y, { width: 60, align: 'right' });
      y += 14;
    }
    doc
      .fontSize(12)
      .text('Gesamtbetrag', totalX, y, { width: 100 })
      .text(formatEur(inv.grossTotal), 490, y, { width: 60, align: 'right' });
    y += 30;
    doc.fontSize(10);

    // §19 exemption text
    if (klein) {
      doc.text(KLEINUNTERNEHMER_TEXT, 50, y, { width: 500 });
      y += 20;
    }
    // Payment due date + IBAN
    doc.text(
      `Bitte überweisen Sie den Gesamtbetrag bis zum ${fmtDate(inv.dueDate)} auf das folgende Konto:`,
      50,
      y,
      { width: 500 },
    );
    y += 16;
    if (seller.bankName) {
      doc.text(`Bank: ${seller.bankName}`, 50, y);
      y += 14;
    }
    doc.text(`IBAN: ${seller.iban ?? '—'}`, 50, y);
    y += 14;
    if (seller.bic) {
      doc.text(`BIC: ${seller.bic}`, 50, y);
      y += 14;
    }
    if (inv.notes) {
      y += 10;
      doc.text(inv.notes, 50, y, { width: 500 });
    }

    // Footer — tax identifier
    const footer = [
      seller.legalName,
      seller.taxNumber ? `Steuernummer: ${seller.taxNumber}` : null,
      seller.vatId ? `USt-IdNr.: ${seller.vatId}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    doc.fontSize(8).fillColor('#555').text(footer, 50, 780, { width: 500, align: 'center' });
    doc.text(
      'Sandbox — For testing only. Do not use for official bookkeeping or tax filing.',
      50,
      792,
      { width: 500, align: 'center' },
    );
    doc.end();
  });
}
