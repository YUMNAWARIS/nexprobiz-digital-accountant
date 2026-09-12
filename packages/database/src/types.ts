/**
 * Row types for all 26 tables (§11). Column names are snake_case exactly as in the migrations.
 * NUMERIC columns are `string` (pg returns them as strings; ARCH-008). DATE columns are `string`
 * ('YYYY-MM-DD') because the API sets a date parser; TIMESTAMPTZ are `Date`.
 */
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}
export interface SessionRow {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}
export interface TenantRow {
  id: string;
  name: string;
  status: string;
  created_at: Date;
}
export interface TenantMembershipRow {
  tenant_id: string;
  user_id: string;
  role: string;
}

export interface BusinessProfileVersionRow {
  id: string;
  tenant_id: string;
  version: number;
  legal_name: string;
  business_name: string | null;
  business_type: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  email: string | null;
  phone: string | null;
  tax_number: string | null;
  vat_id: string | null;
  vat_regime: string;
  vat_taxation_method: string | null;
  chart_of_accounts: string;
  invoice_prefix: string;
  payment_term_days: number;
  iban: string | null;
  bic: string | null;
  bank_name: string | null;
  effective_from: Date;
  effective_to: Date | null;
  created_at: Date;
}

export interface ClientRow {
  id: string;
  tenant_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  country: string;
  vat_id: string | null;
  payment_term_days: number | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
}

export interface InvoiceSequenceRow {
  tenant_id: string;
  year: number;
  next_number: number;
  updated_at: Date;
}

export interface InvoiceRow {
  id: string;
  tenant_id: string;
  client_id: string;
  business_profile_version_id: string;
  status: string;
  invoice_number: string | null;
  issue_date: string | null;
  service_date: string | null;
  due_date: string | null;
  currency: string;
  subtotal_net: string;
  tax_total: string;
  gross_total: string;
  paid_amount: string;
  outstanding_amount: string;
  client_name_snapshot: string | null;
  client_street_snapshot: string | null;
  client_postal_code_snapshot: string | null;
  client_city_snapshot: string | null;
  client_country_snapshot: string | null;
  client_vat_id_snapshot: string | null;
  notes: string | null;
  pdf_document_id: string | null;
  xrechnung_document_id: string | null;
  finalized_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceLineRow {
  id: string;
  invoice_id: string;
  position: number;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  tax_treatment: string;
  tax_rate: string;
  net_amount: string;
  tax_amount: string;
  gross_amount: string;
}

export interface PaymentRow {
  id: string;
  tenant_id: string;
  invoice_id: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  status: string;
  reversal_of: string | null;
  created_at: Date;
}

export interface DocumentRow {
  id: string;
  tenant_id: string;
  type: string;
  blob_name: string;
  original_filename: string;
  mime_type: string;
  size_bytes: string;
  sha256: string;
  created_at: Date;
}

export interface ReceiptRow {
  id: string;
  tenant_id: string;
  document_id: string;
  status: string;
  merchant: string | null;
  receipt_number: string | null;
  receipt_date: string | null;
  currency: string | null;
  net_amount: string | null;
  tax_amount: string | null;
  gross_amount: string | null;
  ocr_confidence: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OcrRunRow {
  id: string;
  tenant_id: string;
  receipt_id: string;
  provider: string;
  model: string;
  status: string;
  raw_result: unknown;
  error_code: string | null;
  error_message: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
}

export interface ExpenseRow {
  id: string;
  tenant_id: string;
  receipt_id: string | null;
  status: string;
  merchant: string;
  description: string | null;
  expense_date: string;
  payment_date: string | null;
  category_id: string;
  tax_treatment: string;
  net_amount: string;
  tax_amount: string;
  gross_amount: string;
  business_percentage: string;
  posted_at: Date | null;
  reversed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BankImportRow {
  id: string;
  tenant_id: string;
  filename: string;
  sha256: string;
  row_count: number;
  imported_count: number;
  duplicate_count: number;
  failed_count: number;
  created_at: Date;
}

export interface BankTransactionRow {
  id: string;
  tenant_id: string;
  bank_import_id: string;
  external_key: string;
  booking_date: string;
  value_date: string | null;
  description: string;
  counterparty: string | null;
  amount: string;
  currency: string;
  classification: string;
  created_at: Date;
}

export interface ReconciliationRow {
  id: string;
  tenant_id: string;
  bank_transaction_id: string;
  target_type: string;
  target_id: string;
  created_at: Date;
}

export interface AccountCategoryRow {
  id: string;
  code: string;
  name_de: string;
  name_en: string;
  type: string;
  active: boolean;
}
export interface ChartAccountMappingRow {
  id: string;
  category_id: string;
  chart: string;
  fiscal_year: number;
  account_number: string;
  euer_code: string | null;
}

export interface JournalEntryRow {
  id: string;
  tenant_id: string;
  source_type: string;
  source_id: string;
  posting_date: string;
  description: string;
  status: string;
  reversal_of: string | null;
  created_at: Date;
}
export interface JournalLineRow {
  id: string;
  journal_entry_id: string;
  account_number: string;
  counter_account: string | null;
  category_code: string | null;
  direction: string;
  amount: string;
  tax_amount: string;
  tax_rate: string | null;
  created_at: Date;
}

export interface TaxRuleSetRow {
  id: string;
  jurisdiction: string;
  tax_year: number;
  version: number;
  active: boolean;
}
export interface TaxRuleValueRow {
  id: string;
  rule_set_id: string;
  rule_key: string;
  value_json: unknown;
}

export interface ExportRow {
  id: string;
  tenant_id: string;
  type: string;
  status: string;
  period_start: string;
  period_end: string;
  document_id: string | null;
  format_version: string | null;
  created_at: Date;
  completed_at: Date | null;
}

export interface AuditEventRow {
  id: string;
  tenant_id: string;
  actor_user_id: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string;
  metadata: unknown;
  request_id: string | null;
  occurred_at: Date;
}

export interface OutboxEventRow {
  id: string;
  tenant_id: string | null;
  event_type: string;
  event_version: number;
  aggregate_type: string;
  aggregate_id: string;
  payload: unknown;
  occurred_at: Date;
  published_at: Date | null;
  attempt_count: number;
}
