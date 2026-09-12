import type { Knex } from 'knex';
import type { PaymentRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export class PaymentsRepository extends TenantScopedRepository<PaymentRow> {
  constructor(db: Knex) {
    super(db, 'payments', 'Payment');
  }
  create(tx: TxCtx, row: Omit<PaymentRow, 'id' | 'tenant_id' | 'created_at'>): Promise<PaymentRow> {
    return this.insertOne(tx, row as never);
  }
  forInvoice(ctx: AnyCtx, invoiceId: string): Promise<PaymentRow[]> {
    return this.q(ctx)
      .where({ invoice_id: invoiceId })
      .orderBy('payment_date', 'asc')
      .orderBy('created_at', 'asc');
  }
}
