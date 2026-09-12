import {
  add,
  eq,
  gt,
  isZero,
  sub,
  ZERO,
  type CancelInvoiceRequest,
  type CreateInvoiceRequest,
  type FinalizeInvoiceResponse,
  type InvoiceListResponse,
  type InvoiceView,
  type ListInvoicesQuery,
  type Money,
  type UpdateInvoiceRequest,
} from '@fa/contracts';
import type { InvoiceRow } from '@fa/database';
import type { Logger } from 'pino';
import { addDays, toIsoDate, yearOf } from '@/core/clock';
import type { AnyCtx, TxCtx } from '@/core/context';
import { AppError, ConflictError, ValidationError } from '@/core/errors';
import type { AccountingService } from '../accounting';
import type { AuditService } from '../audit';
import type { BusinessProfileService } from '../business-profile';
import type { ClientsService } from '../clients';
import type { OutboxService } from '../outbox';
import type { TaxRulesService } from '../tax-rules';
import { formatInvoiceNumber } from './domain/invoice-number';
import { acceptsPayment, isCancellable, isEditable } from './domain/invoice-status';
import { computeInvoiceTotals, type InvoiceTotals, type LineInput } from './domain/invoice-totals';
import type { InvoicingService } from './invoicing.contract';
import { toFinalizeResponse, toInvoiceSummary, toInvoiceView } from './internal/invoice.mapper';
import type { InvoiceRepository } from './internal/invoice.repository';

/** Runs after COMMIT (§22 steps 11–13). Wired in P2 by the composition root. */
export type AfterFinalizeHook = (tenantId: string, invoiceId: string) => Promise<void>;

export interface InvoicingDeps {
  repo: InvoiceRepository;
  clients: ClientsService;
  profile: BusinessProfileService;
  taxRules: TaxRulesService;
  accounting: AccountingService;
  audit: AuditService;
  outbox: OutboxService;
  logger: Logger;
  afterFinalize?: AfterFinalizeHook;
}

export class InvoicingServiceImpl implements InvoicingService {
  constructor(private readonly d: InvoicingDeps) {}

  private async compute(
    tx: TxCtx,
    lines: readonly LineInput[],
    issueDate: string,
    kleinunternehmer: boolean,
  ): Promise<InvoiceTotals> {
    const rates = await this.d.taxRules.ratesForYear(tx, yearOf(issueDate));
    return computeInvoiceTotals(lines, rates.byTreatment, { kleinunternehmer });
  }

  private lineRows(t: InvoiceTotals) {
    return t.lines.map((l) => ({
      position: l.position,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unit_price: l.unitPrice,
      tax_treatment: l.taxTreatment,
      tax_rate: l.taxRate,
      net_amount: l.netAmount,
      tax_amount: l.taxAmount,
      gross_amount: l.grossAmount,
    }));
  }

  async createDraft(tx: TxCtx, input: CreateInvoiceRequest): Promise<InvoiceView> {
    const profile = await this.d.profile.requireCurrent(tx); // Story 3.1 gate applies from draft on
    const client = await this.d.clients.requireActive(tx, input.clientId);
    const issueDate = input.issueDate ?? toIsoDate(tx.now);
    const totals = await this.compute(
      tx,
      input.lines,
      issueDate,
      profile.vatRegime === 'KLEINUNTERNEHMER',
    );
    const row = await this.d.repo.create(tx, {
      client_id: client.id,
      business_profile_version_id: profile.id,
      status: 'DRAFT',
      invoice_number: null,
      issue_date: issueDate,
      service_date: input.serviceDate ?? issueDate,
      due_date:
        input.dueDate ?? addDays(issueDate, client.paymentTermDays ?? profile.paymentTermDays),
      currency: 'EUR',
      subtotal_net: totals.subtotalNet,
      tax_total: totals.taxTotal,
      gross_total: totals.grossTotal,
      paid_amount: ZERO,
      outstanding_amount: totals.grossTotal,
      client_name_snapshot: null,
      client_street_snapshot: null,
      client_postal_code_snapshot: null,
      client_city_snapshot: null,
      client_country_snapshot: null,
      client_vat_id_snapshot: null,
      notes: input.notes ?? null,
      pdf_document_id: null,
      xrechnung_document_id: null,
      finalized_at: null,
      cancelled_at: null,
    });
    const lines = await this.d.repo.replaceLines(tx, row.id, this.lineRows(totals));
    return toInvoiceView(row, lines);
  }

  /** §22 PATCH — DRAFT only, else 409 INVOICE_FINALIZED (TEST-ACC-006). */
  async updateDraft(tx: TxCtx, id: string, input: UpdateInvoiceRequest): Promise<InvoiceView> {
    const row = await this.d.repo.requireByIdForUpdate(tx, id);
    if (!isEditable(row.status as InvoiceView['status']))
      throw new ConflictError('INVOICE_FINALIZED', 'Finalized invoices are immutable.');
    const profile = await this.d.profile.getVersion(tx, row.business_profile_version_id);
    const clientId = input.clientId ?? row.client_id;
    const client = await this.d.clients.requireActive(tx, clientId);
    const issueDate =
      input.issueDate === undefined ? row.issue_date! : (input.issueDate ?? toIsoDate(tx.now));
    const patch: Partial<InvoiceRow> = { client_id: client.id, issue_date: issueDate };
    if (input.serviceDate !== undefined) patch.service_date = input.serviceDate;
    if (input.dueDate !== undefined) patch.due_date = input.dueDate;
    if (input.notes !== undefined) patch.notes = input.notes;
    let lines = await this.d.repo.lines(tx, id);
    if (input.lines) {
      const totals = await this.compute(
        tx,
        input.lines,
        issueDate,
        profile.vatRegime === 'KLEINUNTERNEHMER',
      );
      Object.assign(patch, {
        subtotal_net: totals.subtotalNet,
        tax_total: totals.taxTotal,
        gross_total: totals.grossTotal,
        outstanding_amount: totals.grossTotal,
      });
      lines = await this.d.repo.replaceLines(tx, id, this.lineRows(totals));
    }
    return toInvoiceView(await this.d.repo.update(tx, id, patch), lines);
  }

  /** §22 finalize — steps 1–10 inside tx; 11–13 in onCommit. */
  async finalize(tx: TxCtx, id: string): Promise<FinalizeInvoiceResponse> {
    const row = await this.d.repo.requireByIdForUpdate(tx, id);
    if (row.status !== 'DRAFT')
      throw new ConflictError('INVOICE_FINALIZED', 'Invoice is already finalized.');
    const lines = await this.d.repo.lines(tx, id);
    // 2. validate
    const errors: Array<{ field: string; message: string }> = [];
    if (!lines.length) errors.push({ field: 'lines', message: 'At least one line is required.' });
    if (!row.issue_date) errors.push({ field: 'issueDate', message: 'Issue date is required.' });
    const profile = await this.d.profile.getCurrent(tx);
    if (!profile)
      throw new AppError(
        'BUSINESS_PROFILE_INCOMPLETE',
        'Complete your business profile before finalizing invoices.',
      );
    const client = await this.d.clients.requireActive(tx, row.client_id);
    if (errors.length) throw new ValidationError(errors, 'Invoice cannot be finalized.');
    const issueDate = row.issue_date!;
    // 1+3. lock sequence + allocate
    const year = yearOf(issueDate);
    const seq = await this.d.repo.allocateNumber(tx, year);
    const invoiceNumber = formatInvoiceNumber(profile.invoicePrefix, year, seq);
    // 5. recalculate against the CURRENT profile version (the invoice is bound to it from now on)
    const kleinunternehmer = profile.vatRegime === 'KLEINUNTERNEHMER';
    const totals = await this.compute(
      tx,
      lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unit_price,
        taxTreatment: l.tax_treatment as InvoiceView['lines'][number]['taxTreatment'],
      })),
      issueDate,
      kleinunternehmer,
    );
    await this.d.repo.replaceLines(tx, id, this.lineRows(totals));
    // 4+6. snapshot + FINALIZED
    const updated = await this.d.repo.update(tx, id, {
      status: 'FINALIZED',
      invoice_number: invoiceNumber,
      business_profile_version_id: profile.id,
      subtotal_net: totals.subtotalNet,
      tax_total: totals.taxTotal,
      gross_total: totals.grossTotal,
      paid_amount: ZERO,
      outstanding_amount: totals.grossTotal,
      client_name_snapshot: client.name,
      client_street_snapshot: client.street,
      client_postal_code_snapshot: client.postalCode,
      client_city_snapshot: client.city,
      client_country_snapshot: client.country,
      client_vat_id_snapshot: client.vatId,
      finalized_at: tx.now,
    });
    // 7. journal
    await this.d.accounting.postInvoice(tx, {
      invoiceId: id,
      invoiceNumber,
      postingDate: issueDate,
      chart: profile.chartOfAccounts,
      fiscalYear: year,
      kleinunternehmer,
      groups: totals.groups,
    });
    // 8. audit  9. outbox
    await this.d.audit.record(tx, {
      eventType: 'INVOICE_FINALIZED',
      entityType: 'INVOICE',
      entityId: id,
      metadata: { invoiceNumber, grossTotal: totals.grossTotal },
    });
    await this.d.outbox.publish(tx, {
      eventType: 'InvoiceFinalized',
      aggregateId: id,
      payload: {
        invoiceId: id,
        invoiceNumber,
        grossTotal: totals.grossTotal,
        taxTotal: totals.taxTotal,
        issueDate,
      },
    });
    // 11–13 after COMMIT
    if (this.d.afterFinalize) {
      const hook = this.d.afterFinalize;
      tx.onCommit(() =>
        hook(tx.tenantId, id).catch((err: unknown) =>
          this.d.logger.error({ err, invoiceId: id }, 'post-finalize document generation failed'),
        ),
      );
    }
    return toFinalizeResponse(updated);
  }

  /** §22 cancel — reversal journal, CANCELLED, audit. Original row + documents stay. */
  async cancel(tx: TxCtx, id: string, input: CancelInvoiceRequest): Promise<InvoiceView> {
    const row = await this.d.repo.requireByIdForUpdate(tx, id);
    const status = row.status as InvoiceView['status'];
    if (status === 'CANCELLED')
      throw new ConflictError('INVOICE_ALREADY_CANCELLED', 'Invoice is already cancelled.');
    if (!isCancellable(status))
      throw new ConflictError(
        'INVOICE_NOT_FINALIZED',
        'Only finalized invoices can be cancelled; delete the draft instead.',
      );
    const entries = await this.d.accounting.entriesForSource(tx, 'INVOICE', id);
    const posted = entries.find((e) => e.status === 'POSTED' && !e.reversalOf);
    if (!posted)
      throw new AppError('INTERNAL_ERROR', 'Finalized invoice has no posted journal entry.');
    const reversal = await this.d.accounting.reverseEntry(tx, {
      journalEntryId: posted.id,
      postingDate: toIsoDate(tx.now),
      reason: input.reason,
    });
    const updated = await this.d.repo.update(tx, id, { status: 'CANCELLED', cancelled_at: tx.now });
    await this.d.audit.record(tx, {
      eventType: 'INVOICE_CANCELLED',
      entityType: 'INVOICE',
      entityId: id,
      metadata: {
        reason: input.reason,
        reversalJournalEntryId: reversal.id,
        invoiceNumber: row.invoice_number,
      },
    });
    await this.d.outbox.publish(tx, {
      eventType: 'InvoiceCancelled',
      aggregateId: id,
      payload: { invoiceId: id, reason: input.reason, reversalJournalEntryId: reversal.id },
    });
    return toInvoiceView(updated, await this.d.repo.lines(tx, id));
  }

  async get(ctx: AnyCtx, id: string): Promise<InvoiceView> {
    const row = await this.d.repo.requireById(ctx, id);
    return toInvoiceView(row, await this.d.repo.lines(ctx, id));
  }
  async list(ctx: AnyCtx, q: ListInvoicesQuery): Promise<InvoiceListResponse> {
    const { rows, total } = await this.d.repo.list(ctx, q);
    return {
      data: rows.map(toInvoiceSummary),
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      },
    };
  }

  /** §23 rules: amount > 0, amount <= outstanding, invoice != CANCELLED. */
  async applyPayment(tx: TxCtx, id: string, amount: Money): Promise<InvoiceView> {
    const row = await this.d.repo.requireByIdForUpdate(tx, id);
    const status = row.status as InvoiceView['status'];
    if (status === 'CANCELLED')
      throw new ConflictError('INVOICE_CANCELLED', 'Cancelled invoices cannot receive payments.');
    if (!acceptsPayment(status))
      throw new ConflictError(
        'INVOICE_NOT_FINALIZED',
        'Only finalized invoices can receive payments.',
      );
    const outstanding = row.outstanding_amount as Money;
    if (gt(amount, outstanding))
      throw new ConflictError(
        'PAYMENT_EXCEEDS_OUTSTANDING',
        `Payment ${amount} exceeds outstanding ${outstanding}.`,
      );
    const paid = add(row.paid_amount as Money, amount);
    const left = sub(row.gross_total as Money, paid);
    const next: InvoiceView['status'] = isZero(left) || eq(left, ZERO) ? 'PAID' : 'PARTIALLY_PAID';
    const updated = await this.d.repo.update(tx, id, {
      paid_amount: paid,
      outstanding_amount: left,
      status: next,
    });
    return toInvoiceView(updated, await this.d.repo.lines(tx, id));
  }

  async attachDocuments(
    tx: TxCtx,
    id: string,
    docs: { pdfDocumentId?: string; xrechnungDocumentId?: string },
  ): Promise<void> {
    const patch: Partial<InvoiceRow> = {};
    if (docs.pdfDocumentId) patch.pdf_document_id = docs.pdfDocumentId;
    if (docs.xrechnungDocumentId) patch.xrechnung_document_id = docs.xrechnungDocumentId;
    if (Object.keys(patch).length) await this.d.repo.update(tx, id, patch);
  }
}
