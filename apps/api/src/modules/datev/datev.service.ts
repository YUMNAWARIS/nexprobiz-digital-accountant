import iconv from 'iconv-lite';
import {
  type CreateDatevExportRequest,
  type DatevExportResponse,
  type ExportView,
} from '@fa/contracts';
import type { ExportRow } from '@fa/database';
import { yearOf } from '@/core/clock';
import type { AnyCtx, RequestCtx, TxCtx } from '@/core/context';
import { AppError } from '@/core/errors';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { AccountingService, JournalEntryView } from '../accounting';
import type { AuditService } from '../audit';
import type { BusinessProfileService } from '../business-profile';
import type { DocumentsService } from '../documents';
import type { OutboxService } from '../outbox';
import { entryImbalances, mapEntriesToBookings } from './domain/datev-booking.mapper';
import { DATEV_FORMAT } from './domain/datev-format';
import { serializeBookings } from './domain/datev-serializer';
import type { DatevService } from './datev.contract';
import type { ExportsRepository } from './internal/exports.repository';

function toView(r: ExportRow): ExportView {
  return {
    id: r.id,
    type: r.type as ExportView['type'],
    status: r.status as ExportView['status'],
    periodStart: r.period_start,
    periodEnd: r.period_end,
    documentId: r.document_id,
    formatVersion: r.format_version,
    createdAt: r.created_at.toISOString(),
    completedAt: r.completed_at?.toISOString() ?? null,
  };
}
const compact = (iso: string) => iso.replace(/-/g, '');

/** §33 — DatevExportService → DatevBookingMapper → DatevSerializer. No column generation in controllers. */
export class DatevServiceImpl implements DatevService {
  constructor(
    private readonly repo: ExportsRepository,
    private readonly uow: UnitOfWork,
    private readonly accounting: AccountingService,
    private readonly profile: BusinessProfileService,
    private readonly documents: DocumentsService,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /** §32 step 1 — the PENDING row is committed on its own so a later failure is visible as FAILED. */
  async begin(tx: TxCtx, input: CreateDatevExportRequest): Promise<ExportView> {
    await this.profile.requireCurrent(tx);
    return toView(
      await this.repo.create(tx, {
        type: 'DATEV_BOOKINGS',
        status: 'PENDING',
        period_start: input.periodStart,
        period_end: input.periodEnd,
        document_id: null,
        format_version: DATEV_FORMAT.formatVersion,
        completed_at: null,
      }),
    );
  }

  async fail(tx: TxCtx, exportId: string): Promise<void> {
    await this.repo.update(tx, exportId, { status: 'FAILED' });
  }

  /** §32 steps 2–7 — mapping check → balance check → serialize → store → COMPLETED → audit → event. */
  async generate(
    tx: TxCtx,
    exportId: string,
    input: CreateDatevExportRequest,
  ): Promise<DatevExportResponse> {
    const profile = await this.profile.requireCurrent(tx);
    const exp = await this.repo.requireById(tx, exportId);

    const ids = await this.repo.entryIdsInPeriod(tx, input.periodStart, input.periodEnd);
    const entries: JournalEntryView[] = [];
    for (const id of ids) entries.push(await this.accounting.getEntry(tx, id));

    // Story 13.1 — every categorised line must resolve to a configured SKR account for the profile's chart.
    for (const e of entries) {
      const fy = yearOf(e.postingDate);
      for (const l of e.lines) {
        if (!l.categoryCode) continue;
        const cat = (await this.accounting.listCategories(tx)).find(
          (c) => c.code === l.categoryCode,
        );
        if (!cat)
          throw new AppError(
            'DATEV_ACCOUNT_MAPPING_MISSING',
            `Category ${l.categoryCode} is not configured.`,
          );
        const mapped = await this.accounting
          .resolveAccount(tx, cat.id, profile.chartOfAccounts, fy)
          .catch(() => null);
        if (!mapped)
          throw new AppError(
            'DATEV_ACCOUNT_MAPPING_MISSING',
            `No ${profile.chartOfAccounts} account mapped for ${l.categoryCode} in ${fy}.`,
          );
      }
    }

    const bookings = mapEntriesToBookings(entries, await this.repo.references(tx));
    const unbalanced = entryImbalances(entries);
    if (unbalanced.length > 0)
      throw new AppError(
        'DATEV_EXPORT_FAILED',
        `Export does not balance: journal entries ${unbalanced.join(', ')} are not balanced.`,
      );

    const text = serializeBookings(
      {
        beraternummer: input.beraternummer,
        mandantennummer: input.mandantennummer,
        wirtschaftsjahrBeginn: `${yearOf(input.periodStart)}0101`,
        periodStart: compact(input.periodStart),
        periodEnd: compact(input.periodEnd),
        sachkontenlaenge: 4,
        createdAt: tx.now,
        bezeichnung: `Buchungsstapel ${input.periodStart}–${input.periodEnd} (${profile.chartOfAccounts})`,
      },
      bookings,
    );
    const stamp = compact(tx.now.toISOString().slice(0, 10));
    const filename = `EXTF_Buchungsstapel_${stamp}.csv`;
    const doc = await this.documents.store(tx, {
      type: 'DATEV_EXPORT',
      buffer: iconv.encode(text, 'win1252'),
      mimeType: 'text/csv',
      originalFilename: filename,
    });
    const done = await this.repo.update(tx, exp.id, {
      status: 'COMPLETED',
      document_id: doc.id,
      completed_at: tx.now,
    });
    await this.audit.record(tx, {
      eventType: 'DATEV_EXPORT_GENERATED',
      entityType: 'EXPORT',
      entityId: exp.id,
      metadata: {
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        bookings: bookings.length,
        documentId: doc.id,
        formatVersion: DATEV_FORMAT.formatVersion,
      },
    });
    await this.outbox.publish(tx, {
      eventType: 'DatevExportGenerated',
      aggregateId: exp.id,
      payload: {
        exportId: exp.id,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        documentId: doc.id,
      },
    });
    return { id: done.id, status: 'COMPLETED', downloadUrl: `/api/v1/exports/${done.id}/download` };
  }

  async list(ctx: AnyCtx): Promise<ExportView[]> {
    return (await this.repo.listAll(ctx)).map(toView);
  }
  async get(ctx: AnyCtx, id: string): Promise<ExportView> {
    return toView(await this.repo.requireById(ctx, id));
  }
  async download(ctx: RequestCtx, id: string): Promise<{ buffer: Buffer; filename: string }> {
    return this.uow.read(ctx, async (tx) => {
      const exp = await this.repo.requireById(tx, id);
      if (exp.status !== 'COMPLETED' || !exp.document_id)
        throw new AppError('EXPORT_NOT_COMPLETED', 'Export has no file.');
      const { doc, buffer } = await this.documents.getBuffer(tx, exp.document_id);
      return { buffer, filename: doc.originalFilename };
    });
  }
}
