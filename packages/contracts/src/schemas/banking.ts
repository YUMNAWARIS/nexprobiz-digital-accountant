/** §26 Bank CSV Contract · §27 Bank Transaction APIs · §11.15 / §11.16 */
import { z } from 'zod';
import { BankClassification } from '../enums';
import { MoneySchema } from '../money';
import { body, DateRangeQuery, IsoDate, IsoDateTime, PageQuery, Uuid, paginated } from './common';

/** §26 — the ONE normalized CSV format. Header row must match exactly. */
export const BANK_CSV_HEADERS = [
  'booking_date',
  'value_date',
  'description',
  'counterparty',
  'amount',
  'currency',
] as const;
export const BANK_CSV_HEADER_LINE = BANK_CSV_HEADERS.join(',');
export const BANK_CSV_TEMPLATE = `${BANK_CSV_HEADER_LINE}
2026-09-01,2026-09-01,Adobe Subscription,Adobe,-59.50,EUR
2026-09-05,2026-09-05,Invoice 2026-000001,Example GmbH,952.00,EUR
`;

export const BankCsvRow = z.object({
  booking_date: IsoDate,
  value_date: IsoDate.or(z.literal('')).transform((v) => (v === '' ? null : v)),
  description: z.string().trim().min(1),
  counterparty: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v)),
  amount: MoneySchema,
  currency: z.literal('EUR'),
});
export type BankCsvRow = z.infer<typeof BankCsvRow>;

export const BankImportRowError = z.object({
  line: z.number().int(),
  message: z.string(),
});
export type BankImportRowError = z.infer<typeof BankImportRowError>;

export const BankImportResponse = z.object({
  importId: Uuid,
  rows: z.number().int(),
  imported: z.number().int(),
  duplicates: z.number().int(),
  failed: z.number().int(),
  errors: z.array(BankImportRowError), // "Malformed rows SHALL return their line number."
});
export type BankImportResponse = z.infer<typeof BankImportResponse>;

export const ListBankTransactionsQuery = PageQuery.merge(DateRangeQuery).extend({
  classification: BankClassification.optional(),
  minAmount: MoneySchema.optional(),
  maxAmount: MoneySchema.optional(),
  reconciled: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});
export type ListBankTransactionsQuery = z.infer<typeof ListBankTransactionsQuery>;

export const ClassifyBankTransactionRequest = body({
  classification: BankClassification,
});
export type ClassifyBankTransactionRequest = z.infer<typeof ClassifyBankTransactionRequest>;

export const BankTransactionView = z.object({
  id: Uuid,
  bankImportId: Uuid,
  bookingDate: IsoDate,
  valueDate: IsoDate.nullable(),
  description: z.string(),
  counterparty: z.string().nullable(),
  amount: MoneySchema,
  currency: z.string(),
  classification: BankClassification,
  reconciliation: z
    .object({
      id: Uuid,
      targetType: z.enum(['PAYMENT', 'EXPENSE']),
      targetId: Uuid,
    })
    .nullable(),
  createdAt: IsoDateTime,
});
export type BankTransactionView = z.infer<typeof BankTransactionView>;

export const BankTransactionListResponse = paginated(BankTransactionView);
export type BankTransactionListResponse = z.infer<typeof BankTransactionListResponse>;
