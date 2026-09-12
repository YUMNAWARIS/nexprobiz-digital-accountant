import {
  add,
  applyPercent,
  moneyFromDb,
  type CreateExpenseRequest,
  type ExpenseListResponse,
  type ExpenseView,
  type ListExpensesQuery,
  type ReverseExpenseRequest,
  type UpdateExpenseRequest,
} from '@fa/contracts';
import type { ExpenseRow } from '@fa/database';
import { toIsoDate, yearOf } from '@/core/clock';
import type { AnyCtx, TxCtx } from '@/core/context';
import { AppError, ConflictError, NotFoundError, ValidationError } from '@/core/errors';
import type { AccountingService } from '../accounting';
import type { AuditService } from '../audit';
import type { BusinessProfileService } from '../business-profile';
import type { OutboxService } from '../outbox';
import type { ReceiptsService } from '../receipts';
import type { TaxRulesService } from '../tax-rules';
import type { ExpensesService } from './expenses.contract';
import type { ExpenseJoined, ExpensesRepository } from './internal/expenses.repository';

function toView(r: ExpenseJoined, journalEntryId: string | null): ExpenseView {
  return {
    id: r.id,
    receiptId: r.receipt_id,
    status: r.status as ExpenseView['status'],
    merchant: r.merchant,
    description: r.description,
    expenseDate: r.expense_date,
    paymentDate: r.payment_date,
    categoryId: r.category_id,
    categoryCode: r.category_code,
    categoryName: r.category_name,
    taxTreatment: r.tax_treatment as ExpenseView['taxTreatment'],
    netAmount: moneyFromDb(r.net_amount),
    taxAmount: moneyFromDb(r.tax_amount),
    grossAmount: moneyFromDb(r.gross_amount),
    businessPercentage: r.business_percentage,
    journalEntryId,
    postedAt: r.posted_at?.toISOString() ?? null,
    reversedAt: r.reversed_at?.toISOString() ?? null,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

export class ExpensesServiceImpl implements ExpensesService {
  constructor(
    private readonly repo: ExpensesRepository,
    private readonly receipts: ReceiptsService,
    private readonly accounting: AccountingService,
    private readonly profile: BusinessProfileService,
    private readonly taxRules: TaxRulesService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /** Amounts are user-declared (from the receipt), but must be self-consistent (gross = net + tax). */
  private validateAmounts(net: string, tax: string, gross: string) {
    if (add(net as never, tax as never) !== gross)
      throw new ValidationError(
        [{ field: 'grossAmount', message: `Gross must equal net + tax (${net} + ${tax}).` }],
        'Expense amounts are inconsistent.',
      );
  }

  async create(tx: TxCtx, i: CreateExpenseRequest): Promise<ExpenseView> {
    this.validateAmounts(i.netAmount, i.taxAmount, i.grossAmount);
    const category = await this.accounting.requireCategory(tx, i.categoryId);
    if (category.type !== 'EXPENSE')
      throw new ValidationError([
        { field: 'categoryId', message: 'Category must be an expense category.' },
      ]);
    if (i.receiptId) await this.receipts.requireConfirmed(tx, i.receiptId);
    const row = await this.repo
      .create(tx, {
        receipt_id: i.receiptId ?? null,
        status: 'DRAFT',
        merchant: i.merchant,
        description: i.description ?? null,
        expense_date: i.expenseDate,
        payment_date: i.paymentDate ?? null,
        category_id: i.categoryId,
        tax_treatment: i.taxTreatment,
        net_amount: i.netAmount,
        tax_amount: i.taxAmount,
        gross_amount: i.grossAmount,
        business_percentage: i.businessPercentage,
        posted_at: null,
        reversed_at: null,
      })
      .catch((e: { code?: string; constraint?: string }) => {
        if (e?.code === '23505' && e.constraint === 'expenses_one_per_receipt')
          throw new ConflictError('CONFLICT', 'This receipt already backs an expense.');
        throw e;
      });
    return toView((await this.repo.joined(tx, row.id))!, null);
  }

  /** §25 PATCH — DRAFT only (TEST-ACC-005). */
  async update(tx: TxCtx, id: string, i: UpdateExpenseRequest): Promise<ExpenseView> {
    const r = await this.repo.requireByIdForUpdate(tx, id);
    if (r.status !== 'DRAFT')
      throw new ConflictError(
        'EXPENSE_NOT_DRAFT',
        'Posted expenses are immutable; reverse it instead.',
      );
    const patch: Partial<ExpenseRow> = {};
    if (i.merchant !== undefined) patch.merchant = i.merchant;
    if (i.description !== undefined) patch.description = i.description;
    if (i.expenseDate !== undefined) patch.expense_date = i.expenseDate;
    if (i.paymentDate !== undefined) patch.payment_date = i.paymentDate;
    if (i.taxTreatment !== undefined) patch.tax_treatment = i.taxTreatment;
    if (i.businessPercentage !== undefined) patch.business_percentage = i.businessPercentage;
    if (i.categoryId !== undefined) {
      const c = await this.accounting.requireCategory(tx, i.categoryId);
      if (c.type !== 'EXPENSE')
        throw new ValidationError([
          { field: 'categoryId', message: 'Category must be an expense category.' },
        ]);
      patch.category_id = i.categoryId;
    }
    if (i.receiptId !== undefined) {
      if (i.receiptId) await this.receipts.requireConfirmed(tx, i.receiptId);
      patch.receipt_id = i.receiptId;
    }
    const net = i.netAmount ?? r.net_amount,
      tax = i.taxAmount ?? r.tax_amount,
      gross = i.grossAmount ?? r.gross_amount;
    this.validateAmounts(net, tax, gross);
    Object.assign(patch, { net_amount: net, tax_amount: tax, gross_amount: gross });
    await this.repo.update(tx, id, patch);
    return toView((await this.repo.joined(tx, id))!, null);
  }

  /** §25 post — validate, journal (§13.4 / §13.5), POSTED, audit, outbox. */
  async post(tx: TxCtx, id: string): Promise<ExpenseView> {
    const r = await this.repo.requireByIdForUpdate(tx, id);
    if (r.status !== 'DRAFT')
      throw new ConflictError('EXPENSE_NOT_DRAFT', `Expense is already ${r.status}.`);
    const profile = await this.profile.requireCurrent(tx);
    const klein = profile.vatRegime === 'KLEINUNTERNEHMER';
    const year = yearOf(r.expense_date);
    const taxRate = await this.taxRules.rateFor(
      tx,
      year,
      r.tax_treatment as ExpenseView['taxTreatment'],
    );
    // business_percentage < 100: only the business share is posted (§11.14)
    const net = applyPercent(moneyFromDb(r.net_amount), r.business_percentage);
    const tax = applyPercent(moneyFromDb(r.tax_amount), r.business_percentage);
    const gross = add(net, tax);
    const je = await this.accounting.postExpense(tx, {
      expenseId: id,
      merchant: r.merchant,
      postingDate: r.payment_date ?? r.expense_date,
      chart: profile.chartOfAccounts,
      fiscalYear: year,
      categoryId: r.category_id,
      kleinunternehmer: klein || r.tax_treatment === 'KLEINUNTERNEHMER_19',
      taxTreatment: r.tax_treatment as ExpenseView['taxTreatment'],
      taxRate,
      net,
      tax,
      gross,
    });
    await this.repo.update(tx, id, { status: 'POSTED', posted_at: tx.now });
    await this.audit.record(tx, {
      eventType: 'EXPENSE_POSTED',
      entityType: 'EXPENSE',
      entityId: id,
      metadata: { journalEntryId: je.id, grossAmount: gross, merchant: r.merchant },
    });
    await this.outbox.publish(tx, {
      eventType: 'ExpensePosted',
      aggregateId: id,
      payload: { expenseId: id, grossAmount: gross, journalEntryId: je.id },
    });
    return toView((await this.repo.joined(tx, id))!, je.id);
  }

  /** §25 reverse — reversal journal, REVERSED, audit, outbox. Original stays (TEST-ACC-008). */
  async reverse(tx: TxCtx, id: string, input: ReverseExpenseRequest): Promise<ExpenseView> {
    const r = await this.repo.requireByIdForUpdate(tx, id);
    if (r.status !== 'POSTED')
      throw new ConflictError(
        'EXPENSE_NOT_POSTED',
        `Only posted expenses can be reversed (status ${r.status}).`,
      );
    const entries = await this.accounting.entriesForSource(tx, 'EXPENSE', id);
    const posted = entries.find((e) => e.status === 'POSTED' && !e.reversalOf);
    if (!posted) throw new AppError('INTERNAL_ERROR', 'Posted expense has no journal entry.');
    const rev = await this.accounting.reverseEntry(tx, {
      journalEntryId: posted.id,
      postingDate: toIsoDate(tx.now),
      reason: input.reason,
    });
    await this.repo.update(tx, id, { status: 'REVERSED', reversed_at: tx.now });
    await this.audit.record(tx, {
      eventType: 'EXPENSE_REVERSED',
      entityType: 'EXPENSE',
      entityId: id,
      metadata: { reason: input.reason, reversalJournalEntryId: rev.id },
    });
    await this.outbox.publish(tx, {
      eventType: 'ExpenseReversed',
      aggregateId: id,
      payload: { expenseId: id, reversalJournalEntryId: rev.id },
    });
    return toView((await this.repo.joined(tx, id))!, posted.id);
  }

  async get(ctx: AnyCtx, id: string): Promise<ExpenseView> {
    const r = await this.repo.joined(ctx, id);
    if (!r) throw new NotFoundError('Expense', id);
    return toView(r, await this.journalIdFor(ctx, id));
  }
  async list(ctx: AnyCtx, q: ListExpensesQuery): Promise<ExpenseListResponse> {
    const { rows, total } = await this.repo.list(ctx, q);
    return {
      data: rows.map((r) => toView(r, null)),
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      },
    };
  }
  private async journalIdFor(ctx: AnyCtx, id: string) {
    const entries = await this.accounting.entriesForSource(ctx, 'EXPENSE', id);
    return entries.find((e) => !e.reversalOf)?.id ?? null;
  }
}
