/**
 * §13 Accounting Posting Rules as PURE functions. No I/O.
 * Every builder returns lines that satisfy assertBalanced(); the DB trigger re-checks at COMMIT.
 */
import {
  add,
  eq,
  isPositive,
  sum,
  ZERO,
  type Direction,
  type Money,
  type Rate,
  type TaxTreatment,
} from '@fa/contracts';
import type { SystemAccounts } from './system-accounts';

export interface DraftLine {
  accountNumber: string;
  counterAccount: string | null;
  categoryCode: string | null;
  direction: Direction;
  amount: Money;
  taxAmount: Money;
  taxRate: Rate | null;
}

export class UnbalancedJournalError extends Error {
  constructor(
    readonly debit: Money,
    readonly credit: Money,
  ) {
    super(`JOURNAL_UNBALANCED: debit ${debit} <> credit ${credit}`);
    this.name = 'UnbalancedJournalError';
  }
}

export function totals(lines: readonly DraftLine[]): { debit: Money; credit: Money } {
  return {
    debit: sum(lines.filter((l) => l.direction === 'DEBIT').map((l) => l.amount)),
    credit: sum(lines.filter((l) => l.direction === 'CREDIT').map((l) => l.amount)),
  };
}

/** §11.21 — SUM(DEBIT) = SUM(CREDIT). Also: no zero/negative amounts (DB CHECK amount > 0). */
export function assertBalanced(lines: readonly DraftLine[]): void {
  if (lines.length < 2) throw new UnbalancedJournalError(ZERO, ZERO);
  for (const l of lines)
    if (!isPositive(l.amount))
      throw new Error(`JOURNAL_LINE_NOT_POSITIVE: ${l.accountNumber} ${l.amount}`);
  const t = totals(lines);
  if (!eq(t.debit, t.credit)) throw new UnbalancedJournalError(t.debit, t.credit);
}

const line = (
  p: Omit<DraftLine, 'taxAmount' | 'taxRate' | 'counterAccount' | 'categoryCode'> &
    Partial<DraftLine>,
): DraftLine => ({
  counterAccount: null,
  categoryCode: null,
  taxAmount: ZERO,
  taxRate: null,
  ...p,
});

function outputVatAccount(sys: SystemAccounts, t: TaxTreatment): string {
  return t === 'REDUCED_7' ? sys.OUTPUT_VAT_7 : sys.OUTPUT_VAT_19;
}
function inputVatAccount(sys: SystemAccounts, t: TaxTreatment): string {
  return t === 'REDUCED_7' ? sys.INPUT_VAT_7 : sys.INPUT_VAT_19;
}

/** One VAT group of an invoice: net + tax at one treatment. */
export interface InvoiceVatGroup {
  taxTreatment: TaxTreatment;
  taxRate: Rate;
  net: Money;
  tax: Money;
}

/**
 * §13.1 Regular VAT invoice:      AR DR gross · Revenue CR net · Output VAT CR tax   (per rate group)
 * §13.2 Kleinunternehmer invoice: AR DR net   · Revenue(§19) CR net                   (no VAT line)
 */
export function buildInvoicePosting(p: {
  sys: SystemAccounts;
  revenueAccount: string; // from chart_account_mappings (REVENUE_SERVICES)
  revenueCategoryCode: string;
  kleinunternehmer: boolean;
  groups: readonly InvoiceVatGroup[];
}): DraftLine[] {
  const lines: DraftLine[] = [];
  let gross = ZERO;
  for (const g of p.groups) {
    if (!isPositive(g.net) && !isPositive(g.tax)) continue;
    const revenueAccount = p.kleinunternehmer
      ? p.sys.REVENUE_EXEMPT
      : g.taxTreatment === 'REDUCED_7'
        ? p.sys.REVENUE_7
        : p.revenueAccount;
    if (isPositive(g.net)) {
      lines.push(
        line({
          accountNumber: revenueAccount,
          counterAccount: p.sys.ACCOUNTS_RECEIVABLE,
          categoryCode: p.revenueCategoryCode,
          direction: 'CREDIT',
          amount: g.net,
          taxAmount: g.tax,
          taxRate: g.taxRate,
        }),
      );
    }
    if (!p.kleinunternehmer && isPositive(g.tax)) {
      lines.push(
        line({
          accountNumber: outputVatAccount(p.sys, g.taxTreatment),
          counterAccount: p.sys.ACCOUNTS_RECEIVABLE,
          direction: 'CREDIT',
          amount: g.tax,
          taxRate: g.taxRate,
        }),
      );
    }
    gross = add(gross, add(g.net, p.kleinunternehmer ? ZERO : g.tax));
  }
  lines.unshift(
    line({ accountNumber: p.sys.ACCOUNTS_RECEIVABLE, direction: 'DEBIT', amount: gross }),
  );
  assertBalanced(lines);
  return lines;
}

/** §13.3 Payment: Bank DR amount · AR CR amount */
export function buildPaymentPosting(p: { sys: SystemAccounts; amount: Money }): DraftLine[] {
  const lines = [
    // pivot (no counter): Bank
    line({ accountNumber: p.sys.BANK, direction: 'DEBIT', amount: p.amount }),
    line({
      accountNumber: p.sys.ACCOUNTS_RECEIVABLE,
      counterAccount: p.sys.BANK,
      direction: 'CREDIT',
      amount: p.amount,
    }),
  ];
  assertBalanced(lines);
  return lines;
}

/**
 * §13.4 Regular expense:         Expense DR net · Input VAT DR tax · Bank CR gross
 * §13.5 Kleinunternehmer expense: Expense DR gross · Bank CR gross  (input VAT NOT recoverable)
 */
export function buildExpensePosting(p: {
  sys: SystemAccounts;
  expenseAccount: string;
  expenseCategoryCode: string;
  kleinunternehmer: boolean;
  taxTreatment: TaxTreatment;
  taxRate: Rate;
  net: Money;
  tax: Money;
  gross: Money;
}): DraftLine[] {
  const lines: DraftLine[] = [];
  if (p.kleinunternehmer || !isPositive(p.tax)) {
    lines.push(
      line({
        accountNumber: p.expenseAccount,
        counterAccount: p.sys.BANK,
        categoryCode: p.expenseCategoryCode,
        direction: 'DEBIT',
        amount: p.gross,
        taxRate: p.kleinunternehmer ? null : p.taxRate,
      }),
    );
  } else {
    lines.push(
      line({
        accountNumber: p.expenseAccount,
        counterAccount: p.sys.BANK,
        categoryCode: p.expenseCategoryCode,
        direction: 'DEBIT',
        amount: p.net,
        taxAmount: p.tax,
        taxRate: p.taxRate,
      }),
    );
    lines.push(
      line({
        accountNumber: inputVatAccount(p.sys, p.taxTreatment),
        counterAccount: p.sys.BANK,
        direction: 'DEBIT',
        amount: p.tax,
        taxRate: p.taxRate,
      }),
    );
  }
  // pivot (no counter): Bank
  lines.push(line({ accountNumber: p.sys.BANK, direction: 'CREDIT', amount: p.gross }));
  assertBalanced(lines);
  return lines;
}

/** Reversal: swap every direction, keep account + amount. Net effect exactly zero. */
export function buildReversal(original: readonly DraftLine[]): DraftLine[] {
  const lines: DraftLine[] = original.map((l) => ({
    ...l,
    direction: l.direction === 'DEBIT' ? 'CREDIT' : 'DEBIT',
  }));
  assertBalanced(lines);
  return lines;
}
