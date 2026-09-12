import {
  moneyFromDb,
  rateFromDb,
  type AccountCategoryView,
  type ChartOfAccounts,
  type JournalSourceType,
} from '@fa/contracts';
import type { JournalEntryRow, JournalLineRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { AppError, ConflictError, NotFoundError, rethrowUnique } from '@/core/errors';
import {
  buildExpensePosting,
  buildInvoicePosting,
  buildPaymentPosting,
  buildReversal,
  type DraftLine,
} from './domain/posting-rules';
import { SYSTEM_ACCOUNTS } from './domain/system-accounts';
import type {
  AccountingService,
  JournalEntryView,
  PostExpenseCommand,
  PostInvoiceCommand,
  PostPaymentCommand,
  ReverseEntryCommand,
} from './accounting.contract';
import type { ChartRepository } from './internal/chart.repository';
import type { JournalRepository } from './internal/journal.repository';

const REVENUE_CATEGORY = 'REVENUE_SERVICES';

function toView(e: JournalEntryRow, lines: JournalLineRow[]): JournalEntryView {
  return {
    id: e.id,
    sourceType: e.source_type as JournalSourceType,
    sourceId: e.source_id,
    postingDate: e.posting_date,
    description: e.description,
    status: e.status as 'POSTED' | 'REVERSED',
    reversalOf: e.reversal_of,
    lines: lines.map((l) => ({
      id: l.id,
      accountNumber: l.account_number,
      counterAccount: l.counter_account,
      categoryCode: l.category_code,
      direction: l.direction as 'DEBIT' | 'CREDIT',
      amount: moneyFromDb(l.amount),
      taxAmount: moneyFromDb(l.tax_amount),
      taxRate: l.tax_rate ? rateFromDb(l.tax_rate) : null,
    })),
  };
}

export class AccountingServiceImpl implements AccountingService {
  constructor(
    private readonly journal: JournalRepository,
    private readonly chart: ChartRepository,
  ) {}

  private async write(
    tx: TxCtx,
    head: Omit<JournalEntryRow, 'id' | 'tenant_id' | 'created_at' | 'status'>,
    lines: DraftLine[],
  ): Promise<JournalEntryView> {
    const entry = await this.journal.createEntry(tx, { ...head, status: 'POSTED' });
    const rows = await this.journal.insertLines(tx, entry.id, lines);
    return toView(entry, rows);
  }

  async postInvoice(tx: TxCtx, cmd: PostInvoiceCommand): Promise<JournalEntryView> {
    const revenue = await this.resolveByCode(tx, REVENUE_CATEGORY, cmd.chart, cmd.fiscalYear);
    const lines = buildInvoicePosting({
      sys: SYSTEM_ACCOUNTS[cmd.chart],
      revenueAccount: revenue.accountNumber,
      revenueCategoryCode: REVENUE_CATEGORY,
      kleinunternehmer: cmd.kleinunternehmer,
      groups: cmd.groups,
    });
    return this.write(
      tx,
      {
        source_type: 'INVOICE',
        source_id: cmd.invoiceId,
        posting_date: cmd.postingDate,
        description: `Rechnung ${cmd.invoiceNumber}`,
        reversal_of: null,
      },
      lines,
    );
  }

  async postPayment(tx: TxCtx, cmd: PostPaymentCommand): Promise<JournalEntryView> {
    const lines = buildPaymentPosting({ sys: SYSTEM_ACCOUNTS[cmd.chart], amount: cmd.amount });
    return this.write(
      tx,
      {
        source_type: 'PAYMENT',
        source_id: cmd.paymentId,
        posting_date: cmd.postingDate,
        description: `Zahlung Rechnung ${cmd.invoiceNumber}`,
        reversal_of: null,
      },
      lines,
    );
  }

  async postExpense(tx: TxCtx, cmd: PostExpenseCommand): Promise<JournalEntryView> {
    const acct = await this.resolveAccount(tx, cmd.categoryId, cmd.chart, cmd.fiscalYear);
    const lines = buildExpensePosting({
      sys: SYSTEM_ACCOUNTS[cmd.chart],
      expenseAccount: acct.accountNumber,
      expenseCategoryCode: acct.categoryCode,
      kleinunternehmer: cmd.kleinunternehmer,
      taxTreatment: cmd.taxTreatment,
      taxRate: cmd.taxRate,
      net: cmd.net,
      tax: cmd.tax,
      gross: cmd.gross,
    });
    return this.write(
      tx,
      {
        source_type: 'EXPENSE',
        source_id: cmd.expenseId,
        posting_date: cmd.postingDate,
        description: `Ausgabe ${cmd.merchant}`,
        reversal_of: null,
      },
      lines,
    );
  }

  /** ARCH-005 — original is never edited; a mirrored entry is written and linked via reversal_of. */
  async reverseEntry(tx: TxCtx, cmd: ReverseEntryCommand): Promise<JournalEntryView> {
    const original = await this.journal.requireByIdForUpdate(tx, cmd.journalEntryId);
    if (original.reversal_of)
      throw new ConflictError(
        'JOURNAL_ALREADY_REVERSED',
        'A reversal entry cannot itself be reversed.',
      );
    if (original.status === 'REVERSED')
      throw new ConflictError('JOURNAL_ALREADY_REVERSED', 'This entry has already been reversed.');
    const origLines = await this.journal.linesForEntry(tx, original.id);
    const lines = buildReversal(
      origLines.map((l) => ({
        accountNumber: l.account_number,
        counterAccount: l.counter_account,
        categoryCode: l.category_code,
        direction: l.direction as 'DEBIT' | 'CREDIT',
        amount: moneyFromDb(l.amount),
        taxAmount: moneyFromDb(l.tax_amount),
        taxRate: l.tax_rate ? rateFromDb(l.tax_rate) : null,
      })),
    );
    const entry = await this.journal
      .createEntry(tx, {
        source_type: original.source_type,
        source_id: original.source_id,
        posting_date: cmd.postingDate,
        description: `Storno: ${original.description} — ${cmd.reason}`,
        reversal_of: original.id,
        status: 'POSTED',
      })
      .catch(
        rethrowUnique(
          'journal_entries_reversal_once',
          () =>
            new ConflictError('JOURNAL_ALREADY_REVERSED', 'This entry has already been reversed.'),
        ),
      );
    const rows = await this.journal.insertLines(tx, entry.id, lines);
    await this.journal.markReversed(tx, original.id);
    return toView(entry, rows);
  }

  async getEntry(ctx: AnyCtx, id: string): Promise<JournalEntryView> {
    const e = await this.journal.requireById(ctx, id);
    return toView(e, await this.journal.linesForEntry(ctx, id));
  }
  async entriesForSource(
    ctx: AnyCtx,
    sourceType: JournalSourceType,
    sourceId: string,
  ): Promise<JournalEntryView[]> {
    const entries = await this.journal.forSource(ctx, sourceType, sourceId);
    return Promise.all(
      entries.map(async (e) => toView(e, await this.journal.linesForEntry(ctx, e.id))),
    );
  }
  async listCategories(ctx: AnyCtx): Promise<AccountCategoryView[]> {
    return (await this.chart.categories(ctx)).map((c) => ({
      id: c.id,
      code: c.code,
      nameDe: c.name_de,
      nameEn: c.name_en,
      type: c.type as 'REVENUE' | 'EXPENSE',
      active: c.active,
    }));
  }
  async requireCategory(ctx: AnyCtx, id: string): Promise<AccountCategoryView> {
    const c = await this.chart.category(ctx, id);
    if (!c || !c.active) throw new NotFoundError('AccountCategory', id);
    return {
      id: c.id,
      code: c.code,
      nameDe: c.name_de,
      nameEn: c.name_en,
      type: c.type as 'REVENUE' | 'EXPENSE',
      active: c.active,
    };
  }
  async resolveAccount(
    ctx: AnyCtx,
    categoryId: string,
    chart: ChartOfAccounts,
    fiscalYear: number,
  ) {
    const cat = await this.requireCategory(ctx, categoryId);
    const m = await this.chart.mapping(ctx, categoryId, chart, fiscalYear);
    if (!m)
      throw new AppError(
        'ACCOUNT_MAPPING_MISSING',
        `No ${chart} account mapped for ${cat.code} in ${fiscalYear}.`,
      );
    return { accountNumber: m.account_number, euerCode: m.euer_code, categoryCode: cat.code };
  }
  private async resolveByCode(
    ctx: AnyCtx,
    code: string,
    chart: ChartOfAccounts,
    fiscalYear: number,
  ) {
    const cat = await this.chart.categoryByCode(ctx, code);
    if (!cat) throw new AppError('ACCOUNT_MAPPING_MISSING', `Category ${code} is not seeded.`);
    return this.resolveAccount(ctx, cat.id, chart, fiscalYear);
  }
}
