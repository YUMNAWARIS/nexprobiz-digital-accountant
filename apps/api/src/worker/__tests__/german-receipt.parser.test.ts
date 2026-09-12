import { parseGermanDate, parseGermanReceipt } from '../services/german-receipt.parser';

const REWE = `REWE Markt GmbH
Hauptstr. 12
96047 Bamberg
Tel. 0951 123456
Bon-Nr: 4711
06.09.2026 14:32
Milch 1,5%          1,09 A
Brot                2,49 A
Kaffee 500g        22,32 A
Summe EUR          25,90
MwSt A 19,00%   Netto 21,77   MwSt 4,13   Brutto 25,90
EC-Karte           25,90
Vielen Dank für Ihren Einkauf`;

describe('German receipt parser (§38 map: merchant, date, net, tax, total)', () => {
  it('parses the §24 REWE example: merchant, date, total 25.90, tax 4.13, net 21.77', () => {
    const r = parseGermanReceipt(REWE, [{ text: 'x', confidence: 94.7 }]);
    expect(r.merchant).toBe('REWE Markt GmbH');
    expect(r.receiptDate).toBe('2026-09-06');
    expect(r.grossAmount).toBe('25.90');
    expect(r.taxAmount).toBe('4.13');
    expect(r.netAmount).toBe('21.77');
    expect(r.receiptNumber).toBe('4711');
    expect(Number(r.confidence)).toBeGreaterThan(0.5);
    expect(r.confidence).toMatch(/^\d\.\d{4}$/);
  });
  it('derives net from gross - tax when Netto is absent', () => {
    const r = parseGermanReceipt(
      `Adobe Systems\nRechnung Nr. INV-2026-77\n01.09.2026\nCreative Cloud 50,00\nUSt 19% 9,50\nGesamtbetrag 59,50 €`,
    );
    expect(r).toMatchObject({
      merchant: 'Adobe Systems',
      receiptDate: '2026-09-01',
      grossAmount: '59.50',
      taxAmount: '9.50',
      netAmount: '50.00',
      receiptNumber: 'INV-2026-77',
    });
  });
  it('falls back to the largest amount when no total keyword exists', () => {
    const r = parseGermanReceipt(`Bäckerei Müller\n12.03.26\nBrötchen 0,45\nBrezel 1,20\n1,65`);
    expect(r.grossAmount).toBe('1.65');
    expect(r.receiptDate).toBe('2026-03-12');
    expect(r.taxAmount).toBeNull();
  });
  it('handles thousand separators and ISO dates', () => {
    expect(parseGermanReceipt(`Firma X\n2026-02-28\nSumme 1.234,56`).grossAmount).toBe('1234.56');
    expect(parseGermanDate('am 5.3.2026 um')).toBe('2026-03-05');
    expect(parseGermanDate('99.99.2026')).toBeNull();
  });
  it('never throws on garbage and returns nulls', () => {
    const r = parseGermanReceipt('###\n!!!');
    expect(r.merchant).toBeNull();
    expect(r.grossAmount).toBeNull();
    expect(r.confidence).toMatch(/^\d\.\d{4}$/);
  });
});
