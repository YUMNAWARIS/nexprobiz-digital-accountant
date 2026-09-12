/**
 * §18 Error Contract. Every API error body has exactly this shape.
 * Required: status, code, message, requestId. Optional: details.
 */
import { z } from 'zod';

export const ErrorDetail = z.object({
  field: z.string(),
  message: z.string(),
});
export type ErrorDetail = z.infer<typeof ErrorDetail>;

export const ApiErrorBody = z.object({
  status: z.number().int(),
  code: z.string(),
  message: z.string(),
  details: z.array(ErrorDetail).optional(),
  requestId: z.string(),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBody>;

/**
 * Error codes. Those named in the spec are marked with their section.
 * Codes are stable identifiers the web/mobile apps switch on — never change one in place.
 */
export const ERROR_CODES = {
  // generic
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,

  // §4 — "Do not guess tax treatment."
  UNSUPPORTED_ACCOUNTING_CASE: 422,

  // auth (Story 2.1 / 2.2 / 2.3)
  EMAIL_ALREADY_EXISTS: 409,
  INVALID_CREDENTIALS: 401,
  INVALID_REFRESH_TOKEN: 401,
  SESSION_REVOKED: 401,
  TOKEN_EXPIRED: 401,

  // business profile (Story 3.1)
  BUSINESS_PROFILE_INCOMPLETE: 409,
  BUSINESS_PROFILE_NOT_FOUND: 404,

  // clients (Story 4.1)
  CLIENT_ARCHIVED: 409,

  // invoicing (§18, §22, §14)
  INVOICE_VALIDATION_FAILED: 400,
  INVOICE_FINALIZED: 409,
  INVOICE_NOT_FINALIZED: 409,
  INVOICE_CANCELLED: 409,
  INVOICE_ALREADY_CANCELLED: 409,
  INVOICE_HAS_NO_LINES: 400,
  INVOICE_DOCUMENT_NOT_READY: 409,
  INVALID_STATE_TRANSITION: 409,

  // payments (§23)
  PAYMENT_AMOUNT_INVALID: 400,
  PAYMENT_EXCEEDS_OUTSTANDING: 409,

  // receipts (§24, §16)
  RECEIPT_NOT_REVIEWABLE: 409,
  RECEIPT_ALREADY_CONFIRMED: 409,
  RECEIPT_OCR_FAILED: 409,

  // expenses (§25, §15)
  EXPENSE_NOT_DRAFT: 409,
  EXPENSE_NOT_POSTED: 409,
  EXPENSE_AMOUNTS_INCONSISTENT: 400,
  RECEIPT_NOT_CONFIRMED: 409,

  // banking (§26)
  BANK_CSV_INVALID: 400,
  BANK_CSV_HEADER_MISMATCH: 400,

  // reconciliation (§28)
  RECONCILIATION_AMOUNT_MISMATCH: 409,
  RECONCILIATION_ALREADY_EXISTS: 409,
  RECONCILIATION_TRANSACTION_NOT_BUSINESS: 409,
  RECONCILIATION_TARGET_INVALID: 409,

  // accounting (§11.21)
  JOURNAL_UNBALANCED: 500,
  JOURNAL_ALREADY_REVERSED: 409,
  ACCOUNT_MAPPING_MISSING: 409,

  // datev (Story 13.1)
  DATEV_ACCOUNT_MAPPING_MISSING: 409,
  DATEV_EXPORT_FAILED: 500,
  EXPORT_NOT_COMPLETED: 409,
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
export const ErrorCodeSchema = z.enum(Object.keys(ERROR_CODES) as [ErrorCode, ...ErrorCode[]]);
