import type { BusinessProfileInput, BusinessProfileView } from '@fa/contracts';
import type { BusinessProfileVersionRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { AppError } from '@/core/errors';
import type { AuditService } from '../audit';
import type { OutboxService } from '../outbox';
import type { BusinessProfileService } from './business-profile.contract';
import type { BusinessProfileRepository } from './internal/business-profile.repository';

export function toProfileView(r: BusinessProfileVersionRow): BusinessProfileView {
  return {
    id: r.id,
    version: r.version,
    legalName: r.legal_name,
    businessName: r.business_name,
    businessType: r.business_type as BusinessProfileView['businessType'],
    address: { street: r.street, postalCode: r.postal_code, city: r.city, country: r.country },
    email: r.email,
    phone: r.phone,
    taxNumber: r.tax_number,
    vatId: r.vat_id,
    vatRegime: r.vat_regime as BusinessProfileView['vatRegime'],
    vatTaxationMethod: r.vat_taxation_method as BusinessProfileView['vatTaxationMethod'],
    chartOfAccounts: r.chart_of_accounts as BusinessProfileView['chartOfAccounts'],
    invoicePrefix: r.invoice_prefix,
    paymentTermDays: r.payment_term_days,
    iban: r.iban,
    bic: r.bic,
    bankName: r.bank_name,
    effectiveFrom: r.effective_from.toISOString(),
    effectiveTo: r.effective_to?.toISOString() ?? null,
    createdAt: r.created_at.toISOString(),
  };
}

export class BusinessProfileServiceImpl implements BusinessProfileService {
  constructor(
    private readonly repo: BusinessProfileRepository,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  async getCurrent(ctx: AnyCtx): Promise<BusinessProfileView | null> {
    const r = await this.repo.current(ctx);
    return r ? toProfileView(r) : null;
  }
  async requireCurrent(ctx: AnyCtx): Promise<BusinessProfileView> {
    const v = await this.getCurrent(ctx);
    if (!v)
      throw new AppError('BUSINESS_PROFILE_INCOMPLETE', 'Complete your business profile first.');
    return v;
  }
  async getVersion(ctx: AnyCtx, versionId: string): Promise<BusinessProfileView> {
    return toProfileView(await this.repo.requireById(ctx, versionId));
  }

  /** Story 3.2 — version n is closed (effective_to), version n+1 created. Invoices keep their version id. */
  async upsertVersion(tx: TxCtx, input: BusinessProfileInput): Promise<BusinessProfileView> {
    const prev = await this.repo.currentForUpdate(tx);
    if (prev) await this.repo.closeVersion(tx, prev.id, tx.now);
    const next = await this.repo.createVersion(tx, {
      version: (prev?.version ?? 0) + 1,
      legal_name: input.legalName,
      business_name: input.businessName ?? null,
      business_type: input.businessType,
      street: input.address.street,
      postal_code: input.address.postalCode,
      city: input.address.city,
      country: input.address.country,
      email: input.email ?? null,
      phone: input.phone ?? null,
      tax_number: input.taxNumber ?? null,
      vat_id: input.vatId ?? null,
      vat_regime: input.vatRegime,
      vat_taxation_method: input.vatRegime === 'REGULAR' ? (input.vatTaxationMethod ?? null) : null,
      chart_of_accounts: input.chartOfAccounts,
      invoice_prefix: input.invoicePrefix,
      payment_term_days: input.paymentTermDays,
      iban: input.iban ?? null,
      bic: input.bic ?? null,
      bank_name: input.bankName ?? null,
      effective_from: tx.now,
    });
    await this.audit.record(tx, {
      eventType: 'BUSINESS_PROFILE_CHANGED',
      entityType: 'BUSINESS_PROFILE',
      entityId: next.id,
      metadata: { previousVersion: prev?.version ?? null, newVersion: next.version },
    });
    await this.outbox.publish(tx, {
      eventType: 'BusinessProfileChanged',
      aggregateId: next.id,
      payload: { previousVersion: prev?.version ?? null, newVersion: next.version },
    });
    return toProfileView(next);
  }
}
