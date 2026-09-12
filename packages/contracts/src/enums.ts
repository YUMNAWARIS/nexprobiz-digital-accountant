/**
 * Every enum value is taken verbatim from spec §11 (Database Schema).
 * Each is exported three ways: the const tuple, the Zod enum, and the TS union type.
 */
import { z } from 'zod';

// §11.1 users.status
export const USER_STATUS = ['ACTIVE', 'DISABLED'] as const;
export const UserStatus = z.enum(USER_STATUS);
export type UserStatus = z.infer<typeof UserStatus>;

// §11.3 tenants.status
export const TENANT_STATUS = ['ACTIVE', 'DISABLED'] as const;
export const TenantStatus = z.enum(TENANT_STATUS);
export type TenantStatus = z.infer<typeof TenantStatus>;

// §11.4 tenant_memberships.role — "Only OWNER is permitted in sandbox."
export const TENANT_ROLE = ['OWNER'] as const;
export const TenantRole = z.enum(TENANT_ROLE);
export type TenantRole = z.infer<typeof TenantRole>;

// §11.5 business_profile_versions
export const BUSINESS_TYPE = ['FREIBERUFLER', 'GEWERBETREIBENDER'] as const;
export const BusinessType = z.enum(BUSINESS_TYPE);
export type BusinessType = z.infer<typeof BusinessType>;

export const VAT_REGIME = ['KLEINUNTERNEHMER', 'REGULAR'] as const;
export const VatRegime = z.enum(VAT_REGIME);
export type VatRegime = z.infer<typeof VatRegime>;

export const VAT_TAXATION_METHOD = ['IST', 'SOLL'] as const;
export const VatTaxationMethod = z.enum(VAT_TAXATION_METHOD);
export type VatTaxationMethod = z.infer<typeof VatTaxationMethod>;

export const CHART_OF_ACCOUNTS = ['SKR03', 'SKR04'] as const;
export const ChartOfAccounts = z.enum(CHART_OF_ACCOUNTS);
export type ChartOfAccounts = z.infer<typeof ChartOfAccounts>;

// §11.6 clients.status
export const CLIENT_STATUS = ['ACTIVE', 'ARCHIVED'] as const;
export const ClientStatus = z.enum(CLIENT_STATUS);
export type ClientStatus = z.infer<typeof ClientStatus>;

// §11.8 invoices.status — §14 state machine
export const INVOICE_STATUS = [
  'DRAFT',
  'FINALIZED',
  'PARTIALLY_PAID',
  'PAID',
  'CANCELLED',
] as const;
export const InvoiceStatus = z.enum(INVOICE_STATUS);
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

// §11.9 invoice_lines.tax_treatment / §11.14 expenses.tax_treatment
// KLEINUNTERNEHMER_19 has tax_rate = 0 and tax_amount = 0 but SHALL remain semantically
// distinct from zero-rated VAT.
export const TAX_TREATMENT = ['STANDARD_19', 'REDUCED_7', 'KLEINUNTERNEHMER_19'] as const;
export const TaxTreatment = z.enum(TAX_TREATMENT);
export type TaxTreatment = z.infer<typeof TaxTreatment>;

// §11.10 payments
export const PAYMENT_METHOD = ['BANK_TRANSFER', 'CASH', 'OTHER'] as const;
export const PaymentMethod = z.enum(PAYMENT_METHOD);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const PAYMENT_STATUS = ['RECORDED', 'REVERSED'] as const;
export const PaymentStatus = z.enum(PAYMENT_STATUS);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

// §11.11 documents.type
export const DOCUMENT_TYPE = ['INVOICE_PDF', 'XRECHNUNG_XML', 'RECEIPT', 'DATEV_EXPORT'] as const;
export const DocumentType = z.enum(DOCUMENT_TYPE);
export type DocumentType = z.infer<typeof DocumentType>;

// §11.12 receipts.status — §16 state machine
export const RECEIPT_STATUS = [
  'UPLOADED',
  'OCR_PROCESSING',
  'NEEDS_REVIEW',
  'CONFIRMED',
  'FAILED',
] as const;
export const ReceiptStatus = z.enum(RECEIPT_STATUS);
export type ReceiptStatus = z.infer<typeof ReceiptStatus>;

// §11.13 ocr_runs.status
export const OCR_RUN_STATUS = ['STARTED', 'SUCCEEDED', 'FAILED'] as const;
export const OcrRunStatus = z.enum(OCR_RUN_STATUS);
export type OcrRunStatus = z.infer<typeof OcrRunStatus>;

// §11.13 ocr_runs.provider — Azure replaced by Tesseract (approved deviation, see docs/DEVIATIONS.md)
export const OCR_PROVIDER = ['TESSERACT'] as const;
export const OcrProvider = z.enum(OCR_PROVIDER);
export type OcrProvider = z.infer<typeof OcrProvider>;

// §11.14 expenses.status — §15 state machine
export const EXPENSE_STATUS = ['DRAFT', 'POSTED', 'REVERSED'] as const;
export const ExpenseStatus = z.enum(EXPENSE_STATUS);
export type ExpenseStatus = z.infer<typeof ExpenseStatus>;

// §11.16 bank_transactions.classification
export const BANK_CLASSIFICATION = ['UNREVIEWED', 'BUSINESS', 'PERSONAL', 'TRANSFER'] as const;
export const BankClassification = z.enum(BANK_CLASSIFICATION);
export type BankClassification = z.infer<typeof BankClassification>;

// §11.17 reconciliations.target_type
export const RECONCILIATION_TARGET = ['PAYMENT', 'EXPENSE'] as const;
export const ReconciliationTarget = z.enum(RECONCILIATION_TARGET);
export type ReconciliationTarget = z.infer<typeof ReconciliationTarget>;

// §11.18 account_categories.type
export const ACCOUNT_CATEGORY_TYPE = ['REVENUE', 'EXPENSE'] as const;
export const AccountCategoryType = z.enum(ACCOUNT_CATEGORY_TYPE);
export type AccountCategoryType = z.infer<typeof AccountCategoryType>;

// §11.18 seeded sandbox categories
export const ACCOUNT_CATEGORY_CODE = [
  'REVENUE_SERVICES',
  'OFFICE_SUPPLIES',
  'SOFTWARE',
  'TRAVEL',
  'TELEPHONE_INTERNET',
  'BANK_FEES',
  'PROFESSIONAL_SERVICES',
  'MARKETING',
  'OTHER_BUSINESS_EXPENSE',
] as const;
export const AccountCategoryCode = z.enum(ACCOUNT_CATEGORY_CODE);
export type AccountCategoryCode = z.infer<typeof AccountCategoryCode>;

// §11.20 journal_entries.source_type
export const JOURNAL_SOURCE_TYPE = ['INVOICE', 'PAYMENT', 'EXPENSE'] as const;
export const JournalSourceType = z.enum(JOURNAL_SOURCE_TYPE);
export type JournalSourceType = z.infer<typeof JournalSourceType>;

// §11.20 journal_entries.status
export const JOURNAL_STATUS = ['POSTED', 'REVERSED'] as const;
export const JournalStatus = z.enum(JOURNAL_STATUS);
export type JournalStatus = z.infer<typeof JournalStatus>;

// §11.21 journal_lines.direction
export const DIRECTION = ['DEBIT', 'CREDIT'] as const;
export const Direction = z.enum(DIRECTION);
export type Direction = z.infer<typeof Direction>;

// §11.23 tax_rule_values.rule_key seed
export const TAX_RULE_KEY = [
  'VAT_STANDARD_RATE',
  'VAT_REDUCED_RATE',
  'KLEINUNTERNEHMER_PREVIOUS_YEAR_LIMIT',
  'KLEINUNTERNEHMER_CURRENT_YEAR_LIMIT',
] as const;
export const TaxRuleKey = z.enum(TAX_RULE_KEY);
export type TaxRuleKey = z.infer<typeof TaxRuleKey>;

// §11.24 exports
export const EXPORT_TYPE = ['DATEV_BOOKINGS'] as const;
export const ExportType = z.enum(EXPORT_TYPE);
export type ExportType = z.infer<typeof ExportType>;

export const EXPORT_STATUS = ['PENDING', 'COMPLETED', 'FAILED'] as const;
export const ExportStatus = z.enum(EXPORT_STATUS);
export type ExportStatus = z.infer<typeof ExportStatus>;

// §11.25 audit_events.event_type — every audited mutation in §2.1
export const AUDIT_EVENT_TYPE = [
  'BUSINESS_PROFILE_CHANGED',
  'INVOICE_FINALIZED',
  'INVOICE_CANCELLED',
  'PAYMENT_RECORDED',
  'EXPENSE_POSTED',
  'EXPENSE_REVERSED',
  'BANK_TRANSACTION_CLASSIFIED',
  'TRANSACTION_RECONCILED',
  'DATEV_EXPORT_GENERATED',
] as const;
export const AuditEventType = z.enum(AUDIT_EVENT_TYPE);
export type AuditEventType = z.infer<typeof AuditEventType>;

export const AUDIT_ENTITY_TYPE = [
  'BUSINESS_PROFILE',
  'INVOICE',
  'PAYMENT',
  'EXPENSE',
  'BANK_TRANSACTION',
  'RECONCILIATION',
  'EXPORT',
] as const;
export const AuditEntityType = z.enum(AUDIT_ENTITY_TYPE);
export type AuditEntityType = z.infer<typeof AuditEntityType>;

// §24 receipt upload MIME allowlist (SEC-005)
export const RECEIPT_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export type ReceiptMimeType = (typeof RECEIPT_MIME_TYPES)[number];
export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// §4 sandbox assumptions
export const SANDBOX = {
  COUNTRY: 'DE',
  CURRENCY: 'EUR',
  ACCOUNTING_METHOD: 'EUER',
  FISCAL_YEAR: 'CALENDAR',
  UNSUPPORTED_CASE_MESSAGE: 'This case is not supported in the sandbox. Please review it manually.',
  HEADER_WARNING: 'Sandbox — For testing only. Do not use for official bookkeeping or tax filing.',
  REPORT_DISCLAIMER:
    'Figures are generated for product evaluation and must not be submitted as official tax returns.',
  VAT_PREVIEW_DISCLAIMER: 'Preview only. No tax return has been submitted.',
  DATEV_DISCLAIMER: 'Sandbox export. Validate with a Steuerberater before production use.',
} as const;
