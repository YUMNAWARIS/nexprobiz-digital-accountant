/** §29 Dashboard · §30 EÜR · §31 VAT Preview — read-only, money as strings */
import { z } from 'zod';
import { VatRegime } from '../enums';
import { MoneySchema } from '../money';

export const VatSummary = z.object({
  outputVat: MoneySchema,
  inputVat: MoneySchema,
  payable: MoneySchema,
});

export const DashboardResponse = z.object({
  year: z.number().int(),
  revenue: MoneySchema,
  expenses: MoneySchema,
  profit: MoneySchema,
  outstandingInvoices: MoneySchema,
  vat: VatSummary,
  workItems: z.object({
    unreviewedBankTransactions: z.number().int(),
    receiptsNeedingReview: z.number().int(),
    draftExpenses: z.number().int(),
  }),
});
export type DashboardResponse = z.infer<typeof DashboardResponse>;

export const EuerExpenseLine = z.object({
  categoryCode: z.string(),
  name: z.string(),
  amount: MoneySchema,
});

export const EuerResponse = z.object({
  year: z.number().int(),
  income: z.object({ services: MoneySchema, total: MoneySchema }),
  expenses: z.array(EuerExpenseLine),
  totalExpenses: MoneySchema,
  profit: MoneySchema,
});
export type EuerResponse = z.infer<typeof EuerResponse>;

export const VatReportResponse = z.object({
  year: z.number().int(),
  vatRegime: VatRegime,
  outputVat: MoneySchema,
  inputVat: MoneySchema,
  netVat: MoneySchema,
});
export type VatReportResponse = z.infer<typeof VatReportResponse>;
