import {
  abs,
  eq,
  type CreateReconciliationRequest,
  type Money,
  type ReconciliationView,
} from '@fa/contracts';
import type { TxCtx } from '@/core/context';
import { ConflictError, rethrowUnique } from '@/core/errors';
import type { AuditService } from '../audit';
import type { BankingService } from '../banking';
import type { ExpensesService } from '../expenses';
import type { OutboxService } from '../outbox';
import type { PaymentsService } from '../payments';
import type { ReconciliationService } from './reconciliation.contract';
import type { ReconciliationRepository } from './internal/reconciliation.repository';

export class ReconciliationServiceImpl implements ReconciliationService {
  constructor(
    private readonly repo: ReconciliationRepository,
    private readonly banking: BankingService,
    private readonly payments: PaymentsService,
    private readonly expenses: ExpensesService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * §28 rules: same tenant (RLS + scoped lookups → 404 otherwise) · classification = BUSINESS ·
   * not already reconciled · exact amount match (absolute comparison, Story 11.2) → else 409.
   */
  async create(tx: TxCtx, input: CreateReconciliationRequest): Promise<ReconciliationView> {
    const bt = await this.banking.get(tx, input.bankTransactionId);
    if (bt.reconciliation)
      throw new ConflictError(
        'RECONCILIATION_ALREADY_EXISTS',
        'This bank transaction is already reconciled.',
      );
    if (bt.classification !== 'BUSINESS')
      throw new ConflictError(
        'RECONCILIATION_TRANSACTION_NOT_BUSINESS',
        'Only transactions classified as BUSINESS can be reconciled.',
      );

    let targetAmount: Money;
    if (input.targetType === 'PAYMENT') {
      const p = await this.payments.get(tx, input.targetId);
      if (p.status !== 'RECORDED')
        throw new ConflictError('RECONCILIATION_TARGET_INVALID', 'Payment is reversed.');
      targetAmount = p.amount;
    } else {
      const e = await this.expenses.get(tx, input.targetId);
      if (e.status !== 'POSTED')
        throw new ConflictError(
          'RECONCILIATION_TARGET_INVALID',
          `Expense must be POSTED (is ${e.status}).`,
        );
      targetAmount = e.grossAmount;
    }
    if (!eq(abs(bt.amount), abs(targetAmount))) {
      throw new ConflictError(
        'RECONCILIATION_AMOUNT_MISMATCH',
        `Bank transaction ${bt.amount} does not match ${input.targetType.toLowerCase()} ${targetAmount}. No partial reconciliation in the sandbox.`,
      );
    }
    const row = await this.repo
      .create(tx, {
        bank_transaction_id: bt.id,
        target_type: input.targetType,
        target_id: input.targetId,
      })
      .catch(
        rethrowUnique(
          '',
          () =>
            new ConflictError(
              'RECONCILIATION_ALREADY_EXISTS',
              'Transaction or target is already reconciled.',
            ),
        ),
      );
    await this.audit.record(tx, {
      eventType: 'TRANSACTION_RECONCILED',
      entityType: 'RECONCILIATION',
      entityId: row.id,
      metadata: {
        bankTransactionId: bt.id,
        targetType: input.targetType,
        targetId: input.targetId,
        amount: bt.amount,
      },
    });
    await this.outbox.publish(tx, {
      eventType: 'TransactionReconciled',
      aggregateId: row.id,
      payload: { bankTransactionId: bt.id, targetType: input.targetType, targetId: input.targetId },
    });
    return {
      id: row.id,
      bankTransactionId: row.bank_transaction_id,
      targetType: row.target_type as 'PAYMENT' | 'EXPENSE',
      targetId: row.target_id,
      createdAt: row.created_at.toISOString(),
    };
  }
}
