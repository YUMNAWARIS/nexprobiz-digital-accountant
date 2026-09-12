import { moneyFromDb, type PaymentView, type RecordPaymentRequest } from '@fa/contracts';
import type { PaymentRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import type { AccountingService, JournalEntryView } from '../accounting';
import type { AuditService } from '../audit';
import type { BusinessProfileService } from '../business-profile';
import type { InvoicingService } from '../invoicing';
import type { OutboxService } from '../outbox';
import type { PaymentsService } from './payments.contract';
import type { PaymentsRepository } from './internal/payments.repository';

function toView(r: PaymentRow, journalEntryId: string | null): PaymentView {
  return {
    id: r.id,
    invoiceId: r.invoice_id,
    amount: moneyFromDb(r.amount),
    paymentDate: r.payment_date,
    paymentMethod: r.payment_method as PaymentView['paymentMethod'],
    reference: r.reference,
    status: r.status as PaymentView['status'],
    reversalOf: r.reversal_of,
    journalEntryId,
    createdAt: r.created_at.toISOString(),
  };
}

export class PaymentsServiceImpl implements PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly invoicing: InvoicingService,
    private readonly profile: BusinessProfileService,
    private readonly accounting: AccountingService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /** §23 — rules enforced by invoicing.applyPayment (amount > 0 by schema; <= outstanding; not CANCELLED). */
  async record(tx: TxCtx, invoiceId: string, input: RecordPaymentRequest): Promise<PaymentView> {
    const invoice = await this.invoicing.applyPayment(tx, invoiceId, input.amount);
    const row = await this.repo.create(tx, {
      invoice_id: invoiceId,
      amount: input.amount,
      payment_date: input.paymentDate,
      payment_method: input.paymentMethod,
      reference: input.reference ?? null,
      status: 'RECORDED',
      reversal_of: null,
    });
    const profile = await this.profile.getVersion(tx, invoice.businessProfileVersionId);
    const je = await this.accounting.postPayment(tx, {
      paymentId: row.id,
      invoiceNumber: invoice.invoiceNumber ?? invoiceId,
      postingDate: input.paymentDate,
      chart: profile.chartOfAccounts,
      amount: input.amount,
    });
    await this.audit.record(tx, {
      eventType: 'PAYMENT_RECORDED',
      entityType: 'PAYMENT',
      entityId: row.id,
      metadata: {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        amount: input.amount,
        newStatus: invoice.status,
      },
    });
    await this.outbox.publish(tx, {
      eventType: 'PaymentRecorded',
      aggregateId: row.id,
      payload: {
        paymentId: row.id,
        invoiceId,
        amount: input.amount,
        paymentDate: input.paymentDate,
      },
    });
    return toView(row, je.id);
  }

  async listForInvoice(ctx: AnyCtx, invoiceId: string): Promise<PaymentView[]> {
    await this.invoicing.get(ctx, invoiceId); // 404 if not ours
    const rows = await this.repo.forInvoice(ctx, invoiceId);
    return Promise.all(rows.map(async (r) => toView(r, await this.journalIdFor(ctx, r.id))));
  }
  async get(ctx: AnyCtx, id: string): Promise<PaymentView> {
    const r = await this.repo.requireById(ctx, id);
    return toView(r, await this.journalIdFor(ctx, id));
  }
  private async journalIdFor(ctx: AnyCtx, paymentId: string): Promise<string | null> {
    const entries: JournalEntryView[] = await this.accounting.entriesForSource(
      ctx,
      'PAYMENT',
      paymentId,
    );
    return entries.find((e) => !e.reversalOf)?.id ?? null;
  }
}
