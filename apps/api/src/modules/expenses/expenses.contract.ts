import type {
  CreateExpenseRequest,
  ExpenseListResponse,
  ExpenseView,
  ListExpensesQuery,
  ReverseExpenseRequest,
  UpdateExpenseRequest,
} from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';
/** §9.10 / §25 — DRAFT → POSTED → REVERSED (§15). Only DRAFT may be edited. */
export interface ExpensesService {
  create(tx: TxCtx, input: CreateExpenseRequest): Promise<ExpenseView>;
  update(tx: TxCtx, id: string, input: UpdateExpenseRequest): Promise<ExpenseView>;
  post(tx: TxCtx, id: string): Promise<ExpenseView>;
  reverse(tx: TxCtx, id: string, input: ReverseExpenseRequest): Promise<ExpenseView>;
  get(ctx: AnyCtx, id: string): Promise<ExpenseView>;
  list(ctx: AnyCtx, query: ListExpensesQuery): Promise<ExpenseListResponse>;
}
