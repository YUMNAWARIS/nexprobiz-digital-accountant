/** §22 Invoice REST Contracts · §11.8 invoices · §11.9 invoice_lines · §14 state machine */
import { z } from "zod";
import { InvoiceStatus, TaxTreatment } from "../enums";
import { MoneySchema, PositiveQtySchema, RateSchema } from "../money";
import {
  body,
  DateRangeQuery,
  IsoDate,
  IsoDateTime,
  PageQuery,
  Uuid,
  paginated,
} from "./common";

/**
 * A line as submitted by the client. Note there is NO net/tax/gross here —
 * "Client MUST NOT submit authoritative calculated totals." (§22, ARCH-004)
 */
export const InvoiceLineInput = z
  .object({
    description: z.string().trim().min(1).max(2000),
    quantity: PositiveQtySchema,
    unit: z.string().trim().min(1).max(30).default("unit"),
    unitPrice: z
      .string()
      .trim()
      .regex(
        /^-?\d+(\.\d{1,4})?$/,
        "unitPrice must be a decimal string with up to 4 decimal places",
      ),
    taxTreatment: TaxTreatment,
  })
  .strict();
export type InvoiceLineInput = z.infer<typeof InvoiceLineInput>;

export const CreateInvoiceRequest = body({
  clientId: Uuid,
  issueDate: IsoDate.optional(),
  serviceDate: IsoDate.optional(),
  dueDate: IsoDate.optional(),
  lines: z.array(InvoiceLineInput).min(1).max(200),
  notes: z.string().trim().max(5000).optional().nullable(),
});
export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequest>;

/** PATCH: only DRAFT, otherwise 409 INVOICE_FINALIZED. Full-line replacement when lines given. */
export const UpdateInvoiceRequest = body({
  clientId: Uuid.optional(),
  issueDate: IsoDate.optional().nullable(),
  serviceDate: IsoDate.optional().nullable(),
  dueDate: IsoDate.optional().nullable(),
  lines: z.array(InvoiceLineInput).min(1).max(200).optional(),
  notes: z.string().trim().max(5000).optional().nullable(),
});
export type UpdateInvoiceRequest = z.infer<typeof UpdateInvoiceRequest>;

export const FinalizeInvoiceRequest = body({});
export type FinalizeInvoiceRequest = z.infer<typeof FinalizeInvoiceRequest>;

export const CancelInvoiceRequest = body({
  reason: z.string().trim().min(1).max(1000),
});
export type CancelInvoiceRequest = z.infer<typeof CancelInvoiceRequest>;

export const ListInvoicesQuery = PageQuery.merge(DateRangeQuery).extend({
  status: InvoiceStatus.optional(),
  clientId: Uuid.optional(),
  search: z.string().trim().max(200).optional(),
});
export type ListInvoicesQuery = z.infer<typeof ListInvoicesQuery>;

export const InvoiceLineView = z.object({
  id: Uuid,
  position: z.number().int(),
  description: z.string(),
  quantity: z.string(),
  unit: z.string(),
  unitPrice: z.string(),
  taxTreatment: TaxTreatment,
  taxRate: RateSchema,
  netAmount: MoneySchema,
  taxAmount: MoneySchema,
  grossAmount: MoneySchema,
});
export type InvoiceLineView = z.infer<typeof InvoiceLineView>;

export const ClientSnapshot = z.object({
  name: z.string().nullable(),
  street: z.string().nullable(),
  postalCode: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  vatId: z.string().nullable(),
});
export type ClientSnapshot = z.infer<typeof ClientSnapshot>;

export const InvoiceView = z.object({
  id: Uuid,
  clientId: Uuid,
  businessProfileVersionId: Uuid,
  status: InvoiceStatus,
  invoiceNumber: z.string().nullable(),
  issueDate: IsoDate.nullable(),
  serviceDate: IsoDate.nullable(),
  dueDate: IsoDate.nullable(),
  currency: z.literal("EUR"),
  subtotalNet: MoneySchema,
  taxTotal: MoneySchema,
  grossTotal: MoneySchema,
  paidAmount: MoneySchema,
  outstandingAmount: MoneySchema,
  clientSnapshot: ClientSnapshot,
  notes: z.string().nullable(),
  pdfDocumentId: Uuid.nullable(),
  xrechnungDocumentId: Uuid.nullable(),
  lines: z.array(InvoiceLineView),
  finalizedAt: IsoDateTime.nullable(),
  cancelledAt: IsoDateTime.nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});
export type InvoiceView = z.infer<typeof InvoiceView>;

/** List rows omit lines. */
export const InvoiceSummary = InvoiceView.omit({
  lines: true,
  clientSnapshot: true,
  notes: true,
}).extend({
  clientName: z.string().nullable(),
});
export type InvoiceSummary = z.infer<typeof InvoiceSummary>;

export const InvoiceListResponse = paginated(InvoiceSummary);
export type InvoiceListResponse = z.infer<typeof InvoiceListResponse>;

/** §22 finalize response */
export const FinalizeInvoiceResponse = z.object({
  id: Uuid,
  invoiceNumber: z.string(),
  status: InvoiceStatus,
  subtotalNet: MoneySchema,
  taxTotal: MoneySchema,
  grossTotal: MoneySchema,
});
export type FinalizeInvoiceResponse = z.infer<typeof FinalizeInvoiceResponse>;
