import type { Logger } from 'pino';
import type { RequestCtx, TxCtx } from '@/core/context';
import { AppError } from '@/core/errors';
import type { UnitOfWork } from '@/core/unit-of-work';
import { systemCtx } from '@/core/context';
import type { BusinessProfileService } from '../../business-profile';
import type { DocumentsService } from '../../documents';
import type { InvoicingService } from '../invoicing.contract';
import type { InvoiceDocumentData } from './invoice-document-data';
import { renderInvoicePdf } from './invoice-pdf.generator';
import { renderXRechnung } from './xrechnung.generator';

/**
 * §22 steps 11–13 (after COMMIT) and §41 "Regenerating through normal APIs after finalization
 * SHALL return the stored artifact rather than rendering a new legal document from mutable data."
 */
export class InvoiceDocumentsService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly invoicing: InvoicingService,
    private readonly profile: BusinessProfileService,
    private readonly documents: DocumentsService,
    private readonly logger: Logger,
  ) {}

  private async data(tx: TxCtx, invoiceId: string): Promise<InvoiceDocumentData> {
    const invoice = await this.invoicing.get(tx, invoiceId);
    if (invoice.status === 'DRAFT')
      throw new AppError('INVOICE_NOT_FINALIZED', 'Documents exist only for finalized invoices.');
    const seller = await this.profile.getVersion(tx, invoice.businessProfileVersionId);
    return { invoice, seller };
  }

  /** afterFinalize hook — runs post-commit as SYSTEM for the tenant. Idempotent. */
  async generateAndStore(tenantId: string, invoiceId: string): Promise<void> {
    const ctx: RequestCtx = systemCtx(tenantId, this.logger, `docgen:${invoiceId}`);
    await this.uow.write(ctx, async (tx) => {
      const d = await this.data(tx, invoiceId);
      if (d.invoice.pdfDocumentId && d.invoice.xrechnungDocumentId) return;
      const num = d.invoice.invoiceNumber ?? invoiceId;
      const pdf = d.invoice.pdfDocumentId
        ? null
        : await this.documents.store(tx, {
            type: 'INVOICE_PDF',
            buffer: await renderInvoicePdf(d),
            mimeType: 'application/pdf',
            originalFilename: `Rechnung-${num}.pdf`,
          });
      const xml = d.invoice.xrechnungDocumentId
        ? null
        : await this.documents.store(tx, {
            type: 'XRECHNUNG_XML',
            buffer: Buffer.from(renderXRechnung(d), 'utf8'),
            mimeType: 'application/xml',
            originalFilename: `XRechnung-${num}.xml`,
          });
      await this.invoicing.attachDocuments(tx, invoiceId, {
        pdfDocumentId: pdf?.id,
        xrechnungDocumentId: xml?.id,
      });
    });
  }

  async getPdf(ctx: RequestCtx, invoiceId: string): Promise<{ buffer: Buffer; filename: string }> {
    return this.uow.read(ctx, async (tx) => {
      const inv = await this.invoicing.get(tx, invoiceId);
      if (inv.status === 'DRAFT')
        throw new AppError('INVOICE_NOT_FINALIZED', 'Draft invoices have no PDF.');
      if (!inv.pdfDocumentId)
        throw new AppError(
          'INVOICE_DOCUMENT_NOT_READY',
          'PDF is being generated. Try again shortly.',
        );
      const { doc, buffer } = await this.documents.getBuffer(tx, inv.pdfDocumentId);
      return { buffer, filename: doc.originalFilename };
    });
  }
  async getXRechnung(
    ctx: RequestCtx,
    invoiceId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    return this.uow.read(ctx, async (tx) => {
      const inv = await this.invoicing.get(tx, invoiceId);
      if (inv.status === 'DRAFT')
        throw new AppError('INVOICE_NOT_FINALIZED', 'Draft invoices have no XRechnung.');
      if (!inv.xrechnungDocumentId)
        throw new AppError(
          'INVOICE_DOCUMENT_NOT_READY',
          'XRechnung is being generated. Try again shortly.',
        );
      const { doc, buffer } = await this.documents.getBuffer(tx, inv.xrechnungDocumentId);
      return { buffer, filename: doc.originalFilename };
    });
  }
}
