/**
 * ARCH-008 — Money SHALL use decimal arithmetic. Never JS floating point.
 *
 * Representation across boundaries:
 *   HTTP JSON            string  "1234.56"      (JSON numbers are IEEE-754 doubles — lossy)
 *   Zod / services       Money   branded string, normalized to exactly 2dp
 *   domain functions     Decimal the ONLY place Decimal instances exist
 *   Knex binding         string  pg binds a string to NUMERIC losslessly
 *   Postgres             NUMERIC(15,2) money · NUMERIC(7,4) rates · NUMERIC(15,4) quantities
 *   pg result            string  node-postgres returns OID 1700 as string by default — never override it
 *
 * Rounding: ROUND_HALF_UP (kaufmännische Rundung), which is what DATEV and §14 UStG invoice
 * presentation expect.
 */
import { Decimal } from 'decimal.js';
import { z } from 'zod';

Decimal.set({
  precision: 34,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9e15,
  toExpPos: 9e15,
  modulo: Decimal.ROUND_DOWN,
});

// ---------------------------------------------------------------------------
// Branded types — a raw number or unbranded string is a compile-time error where
// money is expected.
// ---------------------------------------------------------------------------
/** NUMERIC(15,2) — exactly two decimal places, e.g. "119.00" */
export type Money = string & { readonly __brand: 'Money' };
/** NUMERIC(7,4) — exactly four decimal places, e.g. "0.1900" for 19% */
export type Rate = string & { readonly __brand: 'Rate' };
/** NUMERIC(15,4) — exactly four decimal places, e.g. "10.0000" */
export type Qty = string & { readonly __brand: 'Qty' };

export const MONEY_DP = 2;
export const RATE_DP = 4;
export const QTY_DP = 4;

/** NUMERIC(15,2) upper bound: 13 integer digits. */
const MONEY_MAX = new Decimal('9999999999999.99');
/** NUMERIC(15,4) upper bound: 11 integer digits. */
const QTY_MAX = new Decimal('99999999999.9999');
/** NUMERIC(7,4) upper bound: 3 integer digits. */
const RATE_MAX = new Decimal('999.9999');

const DECIMAL_STRING = /^-?\d+(\.\d+)?$/;

export class MoneyError extends Error {
  constructor(
    message: string,
    public readonly value?: unknown,
  ) {
    super(message);
    this.name = 'MoneyError';
  }
}

function parse(v: string | number | Decimal, what: string): Decimal {
  if (v instanceof Decimal) {
    if (!v.isFinite()) throw new MoneyError(`${what}: value is not finite`, v.toString());
    return v;
  }
  if (typeof v === 'number') {
    // Numbers are accepted ONLY as an ergonomic entry point for literals in tests/seeds.
    // Any number with more than 15 significant digits has already lost precision.
    if (!Number.isFinite(v)) throw new MoneyError(`${what}: value is not finite`, v);
    return new Decimal(v);
  }
  const s = v.trim();
  if (!DECIMAL_STRING.test(s)) throw new MoneyError(`${what}: invalid decimal string`, v);
  return new Decimal(s);
}

function fixed(d: Decimal, dp: number): string {
  return d.toDecimalPlaces(dp, Decimal.ROUND_HALF_UP).toFixed(dp);
}

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

/** Construct Money. Rounds HALF_UP to 2dp. Throws on NaN/Infinity/overflow/garbage. */
export function money(v: string | number | Decimal): Money {
  const d = parse(v, 'money');
  if (d.abs().gt(MONEY_MAX)) throw new MoneyError('money: exceeds NUMERIC(15,2)', v);
  return fixed(d, MONEY_DP) as Money;
}

/** Construct a Rate. "0.1900" for 19%. Rounds to 4dp. */
export function rate(v: string | number | Decimal): Rate {
  const d = parse(v, 'rate');
  if (d.abs().gt(RATE_MAX)) throw new MoneyError('rate: exceeds NUMERIC(7,4)', v);
  return fixed(d, RATE_DP) as Rate;
}

/** Construct a Qty. Rounds to 4dp. */
export function qty(v: string | number | Decimal): Qty {
  const d = parse(v, 'qty');
  if (d.abs().gt(QTY_MAX)) throw new MoneyError('qty: exceeds NUMERIC(15,4)', v);
  return fixed(d, QTY_DP) as Qty;
}

export const ZERO: Money = '0.00' as Money;
export const ZERO_RATE: Rate = '0.0000' as Rate;

export function isMoney(v: unknown): v is Money {
  return typeof v === 'string' && /^-?\d{1,13}\.\d{2}$/.test(v);
}
export function isRate(v: unknown): v is Rate {
  return typeof v === 'string' && /^-?\d{1,3}\.\d{4}$/.test(v);
}
export function isQty(v: unknown): v is Qty {
  return typeof v === 'string' && /^-?\d{1,11}\.\d{4}$/.test(v);
}

/**
 * Trust a string already known to be a valid 2dp value (e.g. straight from a NUMERIC(15,2)
 * column). Asserts the shape; does not round. Use in repository mappers only.
 */
export function moneyFromDb(v: string | null | undefined): Money {
  if (v == null) throw new MoneyError('moneyFromDb: null');
  if (!isMoney(v)) {
    // pg may return "119" for NUMERIC(15,2) if the value was inserted without a fraction.
    // Normalize, but only if it is still a clean decimal.
    return money(v);
  }
  return v;
}
export function rateFromDb(v: string | null | undefined): Rate {
  if (v == null) throw new MoneyError('rateFromDb: null');
  return isRate(v) ? v : rate(v);
}
export function qtyFromDb(v: string | null | undefined): Qty {
  if (v == null) throw new MoneyError('qtyFromDb: null');
  return isQty(v) ? v : qty(v);
}

// ---------------------------------------------------------------------------
// Conversion — the ONLY Decimal crossing points
// ---------------------------------------------------------------------------

export function toDecimal(v: Money | Rate | Qty): Decimal {
  return new Decimal(v);
}
/** HALF_UP to 2dp. */
export function fromDecimal(d: Decimal): Money {
  return money(d);
}
/** Throws if d has more than 2dp. Use for invariants where rounding would hide a bug. */
export function fromDecimalExact(d: Decimal): Money {
  if (d.decimalPlaces() > MONEY_DP)
    throw new MoneyError('fromDecimalExact: value has > 2dp', d.toString());
  return money(d);
}

// ---------------------------------------------------------------------------
// Arithmetic — every result is a valid, rounded Money
// ---------------------------------------------------------------------------

export function add(a: Money, b: Money): Money {
  return money(toDecimal(a).plus(toDecimal(b)));
}
export function sub(a: Money, b: Money): Money {
  return money(toDecimal(a).minus(toDecimal(b)));
}
export function neg(a: Money): Money {
  return money(toDecimal(a).negated());
}
export function abs(a: Money): Money {
  return money(toDecimal(a).abs());
}
export function sum(items: readonly Money[]): Money {
  return money(items.reduce((acc, m) => acc.plus(toDecimal(m)), new Decimal(0)));
}
/** unitPrice × quantity → Money, rounded HALF_UP once. This is the persisted line net. */
export function mulQty(unitPrice: Money | Qty, quantity: Qty): Money {
  return money(new Decimal(unitPrice).times(toDecimal(quantity)));
}
/** amount × rate → Money, rounded HALF_UP once. This is how VAT is computed. */
export function applyRate(amount: Money, r: Rate): Money {
  return money(toDecimal(amount).times(toDecimal(r)));
}
/** amount × (percentage / 100). Used for business_percentage on expenses. */
export function applyPercent(amount: Money, percent: string | number): Money {
  return money(toDecimal(amount).times(new Decimal(percent)).dividedBy(100));
}

export function eq(a: Money, b: Money): boolean {
  return toDecimal(a).eq(toDecimal(b));
}
export function gt(a: Money, b: Money): boolean {
  return toDecimal(a).gt(toDecimal(b));
}
export function gte(a: Money, b: Money): boolean {
  return toDecimal(a).gte(toDecimal(b));
}
export function lt(a: Money, b: Money): boolean {
  return toDecimal(a).lt(toDecimal(b));
}
export function lte(a: Money, b: Money): boolean {
  return toDecimal(a).lte(toDecimal(b));
}
export function isZero(a: Money): boolean {
  return toDecimal(a).isZero();
}
export function isPositive(a: Money): boolean {
  return toDecimal(a).gt(0);
}
export function isNegative(a: Money): boolean {
  return toDecimal(a).lt(0);
}
export function cmp(a: Money, b: Money): -1 | 0 | 1 {
  return toDecimal(a).cmp(toDecimal(b)) as -1 | 0 | 1;
}
export function min(a: Money, b: Money): Money {
  return lte(a, b) ? a : b;
}
export function max(a: Money, b: Money): Money {
  return gte(a, b) ? a : b;
}

/**
 * Largest-remainder allocation. Splits `total` across `weights` proportionally so that the
 * parts sum EXACTLY to `total` (no drift). Used to push a per-rate-group VAT figure back
 * onto individual invoice lines.
 *
 * If all weights are zero the total is allocated to the first part.
 */
export function allocate(total: Money, weights: readonly Money[]): Money[] {
  if (weights.length === 0) return [];
  const T = toDecimal(total);
  const W = weights.map(toDecimal);
  const wSum = W.reduce((a, b) => a.plus(b), new Decimal(0));
  if (wSum.isZero()) {
    const out = weights.map(() => ZERO);
    out[0] = total;
    return out;
  }
  const raw = W.map((w) => T.times(w).dividedBy(wSum));
  const floored = raw.map((r) => r.toDecimalPlaces(MONEY_DP, Decimal.ROUND_DOWN));
  let remainder = T.minus(floored.reduce((a, b) => a.plus(b), new Decimal(0)));
  const cent = new Decimal('0.01');
  // Distribute leftover cents to the largest fractional remainders first (stable by index).
  const order = raw
    .map((r, i) => ({ i, frac: r.minus(floored[i]!) }))
    .sort((a, b) => b.frac.cmp(a.frac) || a.i - b.i);
  const result = floored.slice();
  const sign = remainder.isNegative() ? cent.negated() : cent;
  for (const { i } of order) {
    if (remainder.abs().lt(cent)) break;
    result[i] = result[i]!.plus(sign);
    remainder = remainder.minus(sign);
  }
  return result.map((d) => money(d));
}

// ---------------------------------------------------------------------------
// Zod schemas — the edge where strings become branded values
// ---------------------------------------------------------------------------

const decimalString = (dp: number, what: string) =>
  z
    .string()
    .trim()
    .regex(DECIMAL_STRING, `${what} must be a decimal string like "123.45"`)
    .refine(
      (s) => !DECIMAL_STRING.test(s) || new Decimal(s).decimalPlaces() <= dp,
      `${what} may have at most ${dp} decimal places`,
    );

/** Any money value, normalized to 2dp. */
export const MoneySchema = decimalString(MONEY_DP, 'Amount').transform((s) => money(s));
/** Money > 0 */
export const PositiveMoneySchema = MoneySchema.refine(
  (m) => isPositive(m),
  'Amount must be greater than zero',
);
/** Money >= 0 */
export const NonNegativeMoneySchema = MoneySchema.refine(
  (m) => !isNegative(m),
  'Amount must not be negative',
);
export const RateSchema = decimalString(RATE_DP, 'Rate').transform((s) => rate(s));
export const QtySchema = decimalString(QTY_DP, 'Quantity').transform((s) => qty(s));
export const PositiveQtySchema = QtySchema.refine(
  (q) => new Decimal(q).gt(0),
  'Quantity must be greater than zero',
);
/** 0.00 – 100.00 */
export const PercentSchema = decimalString(2, 'Percentage').refine(
  (s) => new Decimal(s).gte(0) && new Decimal(s).lte(100),
  'Percentage must be between 0 and 100',
);

// ---------------------------------------------------------------------------
// Display — ARCH-004: frontends format, they never compute.
// ---------------------------------------------------------------------------

/** "1234.56" -> "1.234,56 €" */
export function formatEur(m: Money | string, locale = 'de-DE'): string {
  const d = new Decimal(m);
  // Intl needs a JS number for formatting only; we are not computing with it.
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(d.toNumber());
}
/** "0.1900" -> "19 %" */
export function formatRatePercent(r: Rate | string, locale = 'de-DE'): string {
  const d = new Decimal(r).times(100);
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(d.toNumber())} %`;
}

export { Decimal };
