import type { PaymentView, RecordPaymentRequest } from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';
/** §9.7 / §23 — manual accounting records. No PSP integration exists. */
export interface PaymentsService {
  record(tx: TxCtx, invoiceId: string, input: RecordPaymentRequest): Promise<PaymentView>;
  listForInvoice(ctx: AnyCtx, invoiceId: string): Promise<PaymentView[]>;
  get(ctx: AnyCtx, id: string): Promise<PaymentView>;
}
