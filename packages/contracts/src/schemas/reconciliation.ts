/** §28 Reconciliation REST Contracts · §11.17 reconciliations */
import { z } from "zod";
import { ReconciliationTarget } from "../enums";
import { body, IsoDateTime, Uuid } from "./common";

export const CreateReconciliationRequest = body({
  bankTransactionId: Uuid,
  targetType: ReconciliationTarget,
  targetId: Uuid,
});
export type CreateReconciliationRequest = z.infer<
  typeof CreateReconciliationRequest
>;

export const ReconciliationView = z.object({
  id: Uuid,
  bankTransactionId: Uuid,
  targetType: ReconciliationTarget,
  targetId: Uuid,
  createdAt: IsoDateTime,
});
export type ReconciliationView = z.infer<typeof ReconciliationView>;
