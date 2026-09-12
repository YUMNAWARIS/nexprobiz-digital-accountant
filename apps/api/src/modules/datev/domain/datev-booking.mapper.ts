/**
 * DatevBookingMapper — journal entries → DATEV bookings (pure).
 * Every journal line that carries a counter_account becomes one two-sided row; the entry's
 * pivot line (AR / Bank, counter = null) is the implicit other side. Because each entry balances,
 * the emitted rows balance too (§33 acceptance 4).
 */
import { abs, toDecimal, type Money } from '@fa/contracts';
import type { JournalEntryView } from '../../accounting';
import type { DatevBooking } from './datev-format';

const ddmm = (iso: string) => `${iso.slice(8, 10)}${iso.slice(5, 7)}`;
/** "1234.56" → "1234,56" (DATEV decimal comma, no thousands separator). */
export const datevAmount = (m: Money) => toDecimal(abs(m)).toFixed(2).replace('.', ',');
const clip = (s: string, n: number) => s.replace(/[\r\n;"]/g, ' ').slice(0, n);

export function mapEntriesToBookings(
  entries: readonly JournalEntryView[],
  refs: Map<string, string>,
): DatevBooking[] {
  const out: DatevBooking[] = [];
  for (const e of entries) {
    const ref = refs.get(`${e.sourceType}:${e.sourceId}`) ?? e.sourceId.slice(0, 8);
    for (const l of e.lines) {
      if (!l.counterAccount) continue; // pivot
      out.push({
        umsatz: datevAmount(l.amount),
        sollHaben: l.direction === 'DEBIT' ? 'S' : 'H',
        wkz: 'EUR',
        konto: l.accountNumber,
        gegenkonto: l.counterAccount,
        belegdatum: ddmm(e.postingDate),
        belegfeld1: clip(ref, 36),
        buchungstext: clip(e.description, 60),
      });
    }
  }
  return out;
}

/**
 * §33 acceptance 4 — "debits balance credits": every exported journal entry must have
 * SUM(DEBIT) = SUM(CREDIT) and exactly one pivot line, otherwise the two-sided rows above
 * would silently drop or double an amount. Returns the offending entry ids (empty = OK).
 */
export function entryImbalances(entries: readonly JournalEntryView[]): string[] {
  const bad: string[] = [];
  for (const e of entries) {
    let debit = toDecimal('0.00' as Money);
    let credit = toDecimal('0.00' as Money);
    let pivots = 0;
    for (const l of e.lines) {
      const v = toDecimal(l.amount);
      if (l.direction === 'DEBIT') debit = debit.plus(v);
      else credit = credit.plus(v);
      if (!l.counterAccount) pivots += 1;
    }
    if (!debit.equals(credit) || pivots !== 1) bad.push(e.id);
  }
  return bad;
}
