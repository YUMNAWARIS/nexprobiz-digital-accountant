/**
 * §34 Domain Event Envelope + §35 MVP Event Schemas (all twelve, v1).
 * Rows in outbox_events carry exactly these payloads.
 */
import { z } from 'zod';
import { BankClassification, ReconciliationTarget } from './enums';
import { MoneySchema } from './money';

const Uuid = z.string().uuid();
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');
const IsoDateTime = z.string().datetime();

// ---- §35 payloads -----------------------------------------------------------

export const InvoiceFinalizedV1 = z.object({
  invoiceId: Uuid,
  invoiceNumber: z.string(),
  grossTotal: MoneySchema,
  taxTotal: MoneySchema,
  issueDate: IsoDate,
});

export const InvoiceCancelledV1 = z.object({
  invoiceId: Uuid,
  reason: z.string(),
  reversalJournalEntryId: Uuid,
});

export const PaymentRecordedV1 = z.object({
  paymentId: Uuid,
  invoiceId: Uuid,
  amount: MoneySchema,
  paymentDate: IsoDate,
});

export const ReceiptUploadedV1 = z.object({
  receiptId: Uuid,
  documentId: Uuid,
});

export const ReceiptExtractedV1 = z.object({
  receiptId: Uuid,
  ocrRunId: Uuid,
  confidence: z.string().regex(/^\d\.\d{4}$/, 'Expected 0.0000–1.0000'),
});

export const ExpensePostedV1 = z.object({
  expenseId: Uuid,
  grossAmount: MoneySchema,
  journalEntryId: Uuid,
});

export const ExpenseReversedV1 = z.object({
  expenseId: Uuid,
  reversalJournalEntryId: Uuid,
});

export const BankTransactionImportedV1 = z.object({
  bankTransactionId: Uuid,
  bankImportId: Uuid,
});

export const BankTransactionClassifiedV1 = z.object({
  bankTransactionId: Uuid,
  classification: BankClassification,
});

export const TransactionReconciledV1 = z.object({
  bankTransactionId: Uuid,
  targetType: ReconciliationTarget,
  targetId: Uuid,
});

export const BusinessProfileChangedV1 = z.object({
  previousVersion: z.number().int().nullable(),
  newVersion: z.number().int(),
});

export const DatevExportGeneratedV1 = z.object({
  exportId: Uuid,
  periodStart: IsoDate,
  periodEnd: IsoDate,
  documentId: Uuid,
});

/** eventType → { version, aggregateType, payload schema } */
export const EVENT_REGISTRY = {
  InvoiceFinalized: {
    version: 1,
    aggregateType: 'Invoice',
    payload: InvoiceFinalizedV1,
  },
  InvoiceCancelled: {
    version: 1,
    aggregateType: 'Invoice',
    payload: InvoiceCancelledV1,
  },
  PaymentRecorded: {
    version: 1,
    aggregateType: 'Payment',
    payload: PaymentRecordedV1,
  },
  ReceiptUploaded: {
    version: 1,
    aggregateType: 'Receipt',
    payload: ReceiptUploadedV1,
  },
  ReceiptExtracted: {
    version: 1,
    aggregateType: 'Receipt',
    payload: ReceiptExtractedV1,
  },
  ExpensePosted: {
    version: 1,
    aggregateType: 'Expense',
    payload: ExpensePostedV1,
  },
  ExpenseReversed: {
    version: 1,
    aggregateType: 'Expense',
    payload: ExpenseReversedV1,
  },
  BankTransactionImported: {
    version: 1,
    aggregateType: 'BankTransaction',
    payload: BankTransactionImportedV1,
  },
  BankTransactionClassified: {
    version: 1,
    aggregateType: 'BankTransaction',
    payload: BankTransactionClassifiedV1,
  },
  TransactionReconciled: {
    version: 1,
    aggregateType: 'Reconciliation',
    payload: TransactionReconciledV1,
  },
  BusinessProfileChanged: {
    version: 1,
    aggregateType: 'BusinessProfile',
    payload: BusinessProfileChangedV1,
  },
  DatevExportGenerated: {
    version: 1,
    aggregateType: 'Export',
    payload: DatevExportGeneratedV1,
  },
} as const;

export type EventType = keyof typeof EVENT_REGISTRY;
export const EventTypeSchema = z.enum(Object.keys(EVENT_REGISTRY) as [EventType, ...EventType[]]);

export type EventPayload<T extends EventType> = z.infer<(typeof EVENT_REGISTRY)[T]['payload']>;

// ---- §34 envelope -----------------------------------------------------------

export const DomainEventEnvelope = z.object({
  eventId: Uuid,
  eventType: EventTypeSchema,
  eventVersion: z.number().int().positive(),
  tenantId: Uuid,
  aggregateType: z.string(),
  aggregateId: Uuid,
  occurredAt: IsoDateTime,
  payload: z.record(z.unknown()),
});
export type DomainEventEnvelope = z.infer<typeof DomainEventEnvelope>;

/** Typed envelope for a specific event. */
export interface DomainEvent<T extends EventType = EventType> {
  eventId: string;
  eventType: T;
  eventVersion: number;
  tenantId: string;
  aggregateType: string;
  aggregateId: string;
  occurredAt: string;
  payload: EventPayload<T>;
}

/** Validates payload against the registry. Throws ZodError on mismatch. */
export function parseEvent<T extends EventType>(eventType: T, payload: unknown): EventPayload<T> {
  return EVENT_REGISTRY[eventType].payload.parse(payload);
}

// ---- §37 OCR queue message --------------------------------------------------

export const RECEIPT_OCR_QUEUE = 'receipt-ocr';

export const ReceiptOcrMessageV1 = z.object({
  version: z.literal(1),
  receiptId: Uuid,
  tenantId: Uuid,
  documentId: Uuid,
});
export type ReceiptOcrMessageV1 = z.infer<typeof ReceiptOcrMessageV1>;
