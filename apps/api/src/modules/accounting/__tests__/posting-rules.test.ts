import { money, rate, sum } from '@fa/contracts';
import {
  assertBalanced,
  buildExpensePosting,
  buildInvoicePosting,
  buildPaymentPosting,
  buildReversal,
  totals,
  UnbalancedJournalError,
} from '../domain/posting-rules';
import { SYSTEM_ACCOUNTS } from '../domain/system-accounts';

const sys = SYSTEM_ACCOUNTS.SKR03;
const R19 = rate('0.19');
const R7 = rate('0.07');
const R0 = rate('0');

describe('§13 posting rules (pure) — TEST-ACC-001 balance holds for every builder', () => {
  it('§13.1 regular invoice: AR DR 119 / Revenue CR 100 / Output VAT CR 19', () => {
    const lines = buildInvoicePosting({
      sys,
      revenueAccount: '8400',
      revenueCategoryCode: 'REVENUE_SERVICES',
      kleinunternehmer: false,
      groups: [{ taxTreatment: 'STANDARD_19', taxRate: R19, net: money(100), tax: money(19) }],
    });
    expect(lines.map((l) => [l.accountNumber, l.direction, l.amount])).toEqual([
      ['1400', 'DEBIT', '119.00'],
      ['8400', 'CREDIT', '100.00'],
      ['1776', 'CREDIT', '19.00'],
    ]);
    expect(totals(lines)).toEqual({ debit: '119.00', credit: '119.00' });
  });
  it('§13.2 Kleinunternehmer invoice: AR DR 100 / Revenue CR 100, no VAT line', () => {
    const lines = buildInvoicePosting({
      sys,
      revenueAccount: '8400',
      revenueCategoryCode: 'REVENUE_SERVICES',
      kleinunternehmer: true,
      groups: [
        { taxTreatment: 'KLEINUNTERNEHMER_19', taxRate: R0, net: money(100), tax: money(0) },
      ],
    });
    expect(lines.map((l) => [l.accountNumber, l.direction, l.amount])).toEqual([
      ['1400', 'DEBIT', '100.00'],
      ['8200', 'CREDIT', '100.00'],
    ]);
  });
  it('mixed 19% + 7% invoice posts two revenue groups and two VAT lines', () => {
    const lines = buildInvoicePosting({
      sys,
      revenueAccount: '8400',
      revenueCategoryCode: 'REVENUE_SERVICES',
      kleinunternehmer: false,
      groups: [
        { taxTreatment: 'STANDARD_19', taxRate: R19, net: money(100), tax: money(19) },
        { taxTreatment: 'REDUCED_7', taxRate: R7, net: money(100), tax: money(7) },
      ],
    });
    expect(lines[0]).toMatchObject({ accountNumber: '1400', direction: 'DEBIT', amount: '226.00' });
    expect(lines.map((l) => l.accountNumber)).toEqual(['1400', '8400', '1776', '8300', '1771']);
    expect(totals(lines).debit).toBe(totals(lines).credit);
  });
  it('§13.3 payment: Bank DR 119 / AR CR 119', () => {
    const lines = buildPaymentPosting({ sys, amount: money(119) });
    expect(lines.map((l) => [l.accountNumber, l.direction, l.amount])).toEqual([
      ['1200', 'DEBIT', '119.00'],
      ['1400', 'CREDIT', '119.00'],
    ]);
  });
  it('§13.4 regular expense: Expense DR 100 / Input VAT DR 19 / Bank CR 119', () => {
    const lines = buildExpensePosting({
      sys,
      expenseAccount: '4980',
      expenseCategoryCode: 'SOFTWARE',
      kleinunternehmer: false,
      taxTreatment: 'STANDARD_19',
      taxRate: R19,
      net: money(100),
      tax: money(19),
      gross: money(119),
    });
    expect(lines.map((l) => [l.accountNumber, l.direction, l.amount])).toEqual([
      ['4980', 'DEBIT', '100.00'],
      ['1576', 'DEBIT', '19.00'],
      ['1200', 'CREDIT', '119.00'],
    ]);
  });
  it('§13.5 Kleinunternehmer expense: Expense DR 119 / Bank CR 119 (input VAT not recoverable)', () => {
    const lines = buildExpensePosting({
      sys,
      expenseAccount: '4980',
      expenseCategoryCode: 'SOFTWARE',
      kleinunternehmer: true,
      taxTreatment: 'STANDARD_19',
      taxRate: R19,
      net: money(100),
      tax: money(19),
      gross: money(119),
    });
    expect(lines.map((l) => [l.accountNumber, l.direction, l.amount])).toEqual([
      ['4980', 'DEBIT', '119.00'],
      ['1200', 'CREDIT', '119.00'],
    ]);
    expect(lines.some((l) => l.accountNumber === '1576')).toBe(false);
  });
  it('reversal swaps directions; original + reversal net to zero per account', () => {
    const orig = buildInvoicePosting({
      sys,
      revenueAccount: '8400',
      revenueCategoryCode: 'REVENUE_SERVICES',
      kleinunternehmer: false,
      groups: [{ taxTreatment: 'STANDARD_19', taxRate: R19, net: money(100), tax: money(19) }],
    });
    const rev = buildReversal(orig);
    for (const acct of ['1400', '8400', '1776']) {
      const all = [...orig, ...rev].filter((l) => l.accountNumber === acct);
      const d = sum(all.filter((l) => l.direction === 'DEBIT').map((l) => l.amount));
      const c = sum(all.filter((l) => l.direction === 'CREDIT').map((l) => l.amount));
      expect(d).toBe(c);
    }
  });
  it('assertBalanced rejects an unbalanced set and single-line sets', () => {
    expect(() =>
      assertBalanced([
        {
          accountNumber: '1',
          counterAccount: null,
          categoryCode: null,
          direction: 'DEBIT',
          amount: money(1),
          taxAmount: money(0),
          taxRate: null,
        },
      ]),
    ).toThrow(UnbalancedJournalError);
    expect(() =>
      assertBalanced([
        {
          accountNumber: '1',
          counterAccount: null,
          categoryCode: null,
          direction: 'DEBIT',
          amount: money(2),
          taxAmount: money(0),
          taxRate: null,
        },
        {
          accountNumber: '2',
          counterAccount: null,
          categoryCode: null,
          direction: 'CREDIT',
          amount: money(1),
          taxAmount: money(0),
          taxRate: null,
        },
      ]),
    ).toThrow(UnbalancedJournalError);
  });
});
