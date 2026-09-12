/**
 * ARCH-004 / ARCH-008 — all invoice math lives here, in decimal, once.
 * Rounding policy: line net rounds ONCE (persisted); VAT is computed ONCE per rate group;
 * group VAT is pushed back onto lines by largest remainder so per-line VAT sums exactly to the group.
 */
import {
  add,
  allocate,
  applyRate,
  money,
  mulQty,
  qty,
  sum,
  ZERO,
  ZERO_RATE,
  type Money,
  type Qty,
  type Rate,
  type TaxTreatment,
} from '@fa/contracts';

export interface LineInput {
  description: string;
  quantity: Qty | string;
  unit: string;
  unitPrice: string; // up to 4dp
  taxTreatment: TaxTreatment;
}
export interface ComputedLine {
  position: number;
  description: string;
  quantity: Qty;
  unit: string;
  unitPrice: string;
  taxTreatment: TaxTreatment;
  taxRate: Rate;
  netAmount: Money;
  taxAmount: Money;
  grossAmount: Money;
}
export interface VatGroup {
  taxTreatment: TaxTreatment;
  taxRate: Rate;
  net: Money;
  tax: Money;
}
export interface InvoiceTotals {
  lines: ComputedLine[];
  groups: VatGroup[];
  subtotalNet: Money;
  taxTotal: Money;
  grossTotal: Money;
}

export function computeInvoiceTotals(
  lines: readonly LineInput[],
  rates: Record<TaxTreatment, Rate>,
  opts: { kleinunternehmer: boolean },
): InvoiceTotals {
  // Step 1 — per-line net, rounded once.
  const prepared = lines.map((l, i) => {
    const q = qty(l.quantity);
    const unitPrice = normalizeUnitPrice(l.unitPrice);
    // §19: a Kleinunternehmer invoice always carries KLEINUNTERNEHMER_19 lines at rate 0.
    const treatment: TaxTreatment = opts.kleinunternehmer ? 'KLEINUNTERNEHMER_19' : l.taxTreatment;
    const rate = treatment === 'KLEINUNTERNEHMER_19' ? ZERO_RATE : rates[treatment];
    return {
      position: i + 1,
      description: l.description,
      quantity: q,
      unit: l.unit,
      unitPrice,
      treatment,
      rate,
      net: mulQty(money(unitPrice), q),
    };
  });

  // Step 2 — group by treatment; VAT computed once per group; allocated back to lines.
  const byTreatment = new Map<TaxTreatment, typeof prepared>();
  for (const p of prepared)
    byTreatment.set(p.treatment, [...(byTreatment.get(p.treatment) ?? []), p]);

  const lineTax = new Map<number, Money>();
  const groups: VatGroup[] = [];
  for (const [treatment, ls] of byTreatment) {
    const net = sum(ls.map((l) => l.net));
    const rate = ls[0]!.rate;
    const tax = treatment === 'KLEINUNTERNEHMER_19' ? ZERO : applyRate(net, rate);
    const perLine = allocate(
      tax,
      ls.map((l) => l.net),
    );
    ls.forEach((l, i) => lineTax.set(l.position, perLine[i]!));
    groups.push({ taxTreatment: treatment, taxRate: rate, net, tax });
  }

  const computed: ComputedLine[] = prepared.map((p) => {
    const tax = lineTax.get(p.position) ?? ZERO;
    return {
      position: p.position,
      description: p.description,
      quantity: p.quantity,
      unit: p.unit,
      unitPrice: p.unitPrice,
      taxTreatment: p.treatment,
      taxRate: p.rate,
      netAmount: p.net,
      taxAmount: tax,
      grossAmount: add(p.net, tax),
    };
  });

  // Step 3 — invoice totals are exact sums of exact group values.
  const subtotalNet = sum(groups.map((g) => g.net));
  const taxTotal = sum(groups.map((g) => g.tax));
  const totals: InvoiceTotals = {
    lines: computed,
    groups,
    subtotalNet,
    taxTotal,
    grossTotal: add(subtotalNet, taxTotal),
  };
  assertTotalsConsistent(totals);
  return totals;
}

/** NUMERIC(15,4) unit price as a 4dp string. */
export function normalizeUnitPrice(v: string): string {
  return qty(v);
}

export function assertTotalsConsistent(t: InvoiceTotals): void {
  if (add(t.subtotalNet, t.taxTotal) !== t.grossTotal) throw new Error('INVOICE_GROSS_MISMATCH');
  if (sum(t.lines.map((l) => l.netAmount)) !== t.subtotalNet)
    throw new Error('INVOICE_NET_LINE_MISMATCH');
  if (sum(t.lines.map((l) => l.taxAmount)) !== t.taxTotal) throw new Error('VAT_ALLOCATION_DRIFT');
  for (const l of t.lines)
    if (
      l.taxTreatment === 'KLEINUNTERNEHMER_19' &&
      (l.taxAmount !== ZERO || l.taxRate !== ZERO_RATE)
    )
      throw new Error('KLEINUNTERNEHMER_MUST_BE_ZERO');
}
