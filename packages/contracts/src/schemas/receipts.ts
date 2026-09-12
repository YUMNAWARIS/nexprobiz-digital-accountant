/** §24 Receipt REST Contracts · §11.12 receipts · §11.13 ocr_runs · §16 state machine */
import { z } from "zod";
import { ReceiptStatus } from "../enums";
import { MoneySchema } from "../money";
import {
  body,
  IsoDate,
  IsoDateTime,
  PageQuery,
  Uuid,
  paginated,
} from "./common";

/** 202 response on upload */
export const ReceiptUploadResponse = z.object({
  id: Uuid,
  status: ReceiptStatus,
});
export type ReceiptUploadResponse = z.infer<typeof ReceiptUploadResponse>;

export const ConfirmReceiptRequest = body({
  merchant: z.string().trim().min(1).max(200),
  receiptNumber: z.string().trim().max(100).optional().nullable(),
  receiptDate: IsoDate,
  netAmount: MoneySchema,
  taxAmount: MoneySchema,
  grossAmount: MoneySchema,
});
export type ConfirmReceiptRequest = z.infer<typeof ConfirmReceiptRequest>;

export const ReceiptView = z.object({
  id: Uuid,
  documentId: Uuid,
  status: ReceiptStatus,
  merchant: z.string().nullable(),
  receiptNumber: z.string().nullable(),
  receiptDate: IsoDate.nullable(),
  currency: z.string().nullable(),
  netAmount: MoneySchema.nullable(),
  taxAmount: MoneySchema.nullable(),
  grossAmount: MoneySchema.nullable(),
  ocrConfidence: z.string().nullable(), // NUMERIC(5,4) as "0.9470"
  expenseId: Uuid.nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});
export type ReceiptView = z.infer<typeof ReceiptView>;

export const ListReceiptsQuery = PageQuery.extend({
  status: ReceiptStatus.optional(),
});
export type ListReceiptsQuery = z.infer<typeof ListReceiptsQuery>;
export const ReceiptListResponse = paginated(ReceiptView);
export type ReceiptListResponse = z.infer<typeof ReceiptListResponse>;
