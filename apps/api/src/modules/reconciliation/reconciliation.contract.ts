import type { CreateReconciliationRequest, ReconciliationView } from '@fa/contracts';
import type { TxCtx } from '@/core/context';
/** §9.12 / §28 — bank transaction ↔ payment | expense. No partial reconciliation. */
export interface ReconciliationService {
  create(tx: TxCtx, input: CreateReconciliationRequest): Promise<ReconciliationView>;
}
