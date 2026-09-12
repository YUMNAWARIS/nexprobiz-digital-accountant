import type {
  AccountCategoryView,
  ChartOfAccounts,
  Direction,
  JournalSourceType,
  Money,
  Rate,
  TaxTreatment,
} from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';

export interface JournalLineView {
  id: string;
  accountNumber: string;
  counterAccount: string | null;
  categoryCode: string | null;
  direction: Direction;
  amount: Money;
  taxAmount: Money;
  taxRate: Rate | null;
}
export interface JournalEntryView {
  id: string;
  sourceType: JournalSourceType;
  sourceId: string;
  postingDate: string;
  description: string;
  status: 'POSTED' | 'REVERSED';
  reversalOf: string | null;
  lines: JournalLineView[];
}

export interface PostInvoiceCommand {
  invoiceId: string;
  invoiceNumber: string;
  postingDate: string;
  chart: ChartOfAccounts;
  fiscalYear: number;
  kleinunternehmer: boolean;
  groups: Array<{ taxTreatment: TaxTreatment; taxRate: Rate; net: Money; tax: Money }>;
}
export interface PostPaymentCommand {
  paymentId: string;
  invoiceNumber: string;
  postingDate: string;
  chart: ChartOfAccounts;
  amount: Money;
}
export interface PostExpenseCommand {
  expenseId: string;
  merchant: string;
  postingDate: string;
  chart: ChartOfAccounts;
  fiscalYear: number;
  categoryId: string;
  kleinunternehmer: boolean;
  taxTreatment: TaxTreatment;
  taxRate: Rate;
  net: Money;
  tax: Money;
  gross: Money;
}
export interface ReverseEntryCommand {
  journalEntryId: string;
  postingDate: string;
  reason: string;
}

/** §9.13 — the ONLY way into the ledger. No arbitrary line writes exist. */
export interface AccountingPostingService {
  postInvoice(tx: TxCtx, cmd: PostInvoiceCommand): Promise<JournalEntryView>;
  postPayment(tx: TxCtx, cmd: PostPaymentCommand): Promise<JournalEntryView>;
  postExpense(tx: TxCtx, cmd: PostExpenseCommand): Promise<JournalEntryView>;
  reverseEntry(tx: TxCtx, cmd: ReverseEntryCommand): Promise<JournalEntryView>;
}
export interface AccountingReadService {
  getEntry(ctx: AnyCtx, id: string): Promise<JournalEntryView>;
  entriesForSource(
    ctx: AnyCtx,
    sourceType: JournalSourceType,
    sourceId: string,
  ): Promise<JournalEntryView[]>;
  listCategories(ctx: AnyCtx): Promise<AccountCategoryView[]>;
  requireCategory(ctx: AnyCtx, categoryId: string): Promise<AccountCategoryView>;
  /** Throws ACCOUNT_MAPPING_MISSING. */
  resolveAccount(
    ctx: AnyCtx,
    categoryId: string,
    chart: ChartOfAccounts,
    fiscalYear: number,
  ): Promise<{ accountNumber: string; euerCode: string | null; categoryCode: string }>;
}
export type AccountingService = AccountingPostingService & AccountingReadService;
