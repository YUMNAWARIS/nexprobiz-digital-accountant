import type {
  CancelInvoiceRequest,
  CreateInvoiceRequest,
  FinalizeInvoiceResponse,
  InvoiceListResponse,
  InvoiceView,
  ListInvoicesQuery,
  Money,
  UpdateInvoiceRequest,
} from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';

/** §9.6 / §22 */
export interface InvoicingService {
  createDraft(tx: TxCtx, input: CreateInvoiceRequest): Promise<InvoiceView>;
  updateDraft(tx: TxCtx, id: string, input: UpdateInvoiceRequest): Promise<InvoiceView>;
  finalize(tx: TxCtx, id: string): Promise<FinalizeInvoiceResponse>;
  cancel(tx: TxCtx, id: string, input: CancelInvoiceRequest): Promise<InvoiceView>;
  get(ctx: AnyCtx, id: string): Promise<InvoiceView>;
  list(ctx: AnyCtx, query: ListInvoicesQuery): Promise<InvoiceListResponse>;
  /** Used by PaymentsModule — the only way invoice paid/outstanding/status change. */
  applyPayment(tx: TxCtx, id: string, amount: Money): Promise<InvoiceView>;
  /** Stored document ids (set after finalize by the document generators). */
  attachDocuments(
    tx: TxCtx,
    id: string,
    docs: { pdfDocumentId?: string; xrechnungDocumentId?: string },
  ): Promise<void>;
}
