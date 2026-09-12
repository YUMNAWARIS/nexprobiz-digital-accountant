import { rate, type Rate, type TaxTreatment } from '@fa/contracts';
import { computeInvoiceTotals } from '../domain/invoice-totals';
import { formatInvoiceNumber } from '../domain/invoice-number';
import { canTransition } from '../domain/invoice-status';

const rates: Record<TaxTreatment, Rate> = {
  STANDARD_19: rate('0.19'),
  REDUCED_7: rate('0.07'),
  KLEINUNTERNEHMER_19: rate('0'),
};
const line = (unitPrice: string, quantity = '1', taxTreatment: TaxTreatment = 'STANDARD_19') => ({
  description: 'x',
  quantity,
  unit: 'unit',
  unitPrice,
  taxTreatment,
});

describe('computeInvoiceTotals — Story 5.2 / TEST-ACC-002..004', () => {
  it('TEST-ACC-002: 19% — net 100, tax 19, gross 119', () => {
    const t = computeInvoiceTotals([line('100')], rates, { kleinunternehmer: false });
    expect([t.subtotalNet, t.taxTotal, t.grossTotal]).toEqual(['100.00', '19.00', '119.00']);
  });
  it('TEST-ACC-003: 7% — net 100, tax 7, gross 107', () => {
    const t = computeInvoiceTotals([line('100', '1', 'REDUCED_7')], rates, {
      kleinunternehmer: false,
    });
    expect([t.subtotalNet, t.taxTotal, t.grossTotal]).toEqual(['100.00', '7.00', '107.00']);
  });
  it('TEST-ACC-004: Kleinunternehmer — net 100, tax 0, gross 100, treatment forced to KLEINUNTERNEHMER_19', () => {
    const t = computeInvoiceTotals([line('100', '1', 'STANDARD_19')], rates, {
      kleinunternehmer: true,
    });
    expect([t.subtotalNet, t.taxTotal, t.grossTotal]).toEqual(['100.00', '0.00', '100.00']);
    expect(t.lines[0]).toMatchObject({
      taxTreatment: 'KLEINUNTERNEHMER_19',
      taxRate: '0.0000',
      taxAmount: '0.00',
    });
  });
  it('§22 example: 10 h × 80.00 @19% → 800 / 152 / 952', () => {
    const t = computeInvoiceTotals([line('80.0000', '10.0000')], rates, {
      kleinunternehmer: false,
    });
    expect([t.subtotalNet, t.taxTotal, t.grossTotal]).toEqual(['800.00', '152.00', '952.00']);
  });
  it('multiple lines + decimal quantities: no float drift, per-line VAT sums to group VAT', () => {
    const t = computeInvoiceTotals(
      [
        line('0.10', '3.3333'),
        line('19.99', '3'),
        line('33.335', '1'),
        line('0.03'),
        line('0.03'),
        line('0.03'),
      ],
      rates,
      { kleinunternehmer: false },
    );
    // nets: 0.33 + 59.97 + 33.34 + 0.03×3 = 93.73 ; VAT once on group: 93.73×0.19 = 17.8087 → 17.81
    expect(t.subtotalNet).toBe('93.73');
    expect(t.taxTotal).toBe('17.81');
    expect(t.grossTotal).toBe('111.54');
    const lineTaxSum = t.lines.reduce(
      (a, l) => (Number(a) + Number(l.taxAmount)).toFixed(2),
      '0.00',
    );
    expect(lineTaxSum).toBe('17.81');
  });
  it('mixed rates produce two groups', () => {
    const t = computeInvoiceTotals([line('100'), line('100', '1', 'REDUCED_7')], rates, {
      kleinunternehmer: false,
    });
    expect(t.groups.map((g) => [g.taxTreatment, g.net, g.tax])).toEqual([
      ['STANDARD_19', '100.00', '19.00'],
      ['REDUCED_7', '100.00', '7.00'],
    ]);
    expect(t.grossTotal).toBe('226.00');
  });
});

describe('invoice number + state machine', () => {
  it('formats 2026-000001', () => {
    expect(formatInvoiceNumber('', 2026, 1)).toBe('2026-000001');
    expect(formatInvoiceNumber('RE-', 2026, 42)).toBe('RE-2026-000042');
  });
  it('§14 transitions', () => {
    expect(canTransition('DRAFT', 'FINALIZED')).toBe(true);
    expect(canTransition('DRAFT', 'PAID')).toBe(false);
    expect(canTransition('FINALIZED', 'CANCELLED')).toBe(true);
    expect(canTransition('PAID', 'CANCELLED')).toBe(true);
    expect(canTransition('CANCELLED', 'FINALIZED')).toBe(false);
  });
});
