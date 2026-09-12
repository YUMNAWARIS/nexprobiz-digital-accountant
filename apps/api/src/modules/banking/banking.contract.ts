import type {
  BankClassification,
  BankImportResponse,
  BankTransactionListResponse,
  BankTransactionView,
  ListBankTransactionsQuery,
} from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';
/** §9.11 — BankingModule SHALL NOT change invoice or expense state directly. */
export interface BankingService {
  importCsv(tx: TxCtx, file: { buffer: Buffer; filename: string }): Promise<BankImportResponse>;
  list(ctx: AnyCtx, query: ListBankTransactionsQuery): Promise<BankTransactionListResponse>;
  get(ctx: AnyCtx, id: string): Promise<BankTransactionView>;
  classify(tx: TxCtx, id: string, classification: BankClassification): Promise<BankTransactionView>;
}
