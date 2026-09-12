import {
  moneyFromDb,
  qtyFromDb,
  rateFromDb,
  type FinalizeInvoiceResponse,
  type InvoiceSummary,
  type InvoiceView,
} from '@fa/contracts';
import type { InvoiceLineRow, InvoiceRow } from '@fa/database';

export function toInvoiceView(r: InvoiceRow, lines: InvoiceLineRow[]): InvoiceView {
  return {
    id: r.id,
    clientId: r.client_id,
    businessProfileVersionId: r.business_profile_version_id,
    status: r.status as InvoiceView['status'],
    invoiceNumber: r.invoice_number,
    issueDate: r.issue_date,
    serviceDate: r.service_date,
    dueDate: r.due_date,
    currency: 'EUR',
    subtotalNet: moneyFromDb(r.subtotal_net),
    taxTotal: moneyFromDb(r.tax_total),
    grossTotal: moneyFromDb(r.gross_total),
    paidAmount: moneyFromDb(r.paid_amount),
    outstandingAmount: moneyFromDb(r.outstanding_amount),
    clientSnapshot: {
      name: r.client_name_snapshot,
      street: r.client_street_snapshot,
      postalCode: r.client_postal_code_snapshot,
      city: r.client_city_snapshot,
      country: r.client_country_snapshot,
      vatId: r.client_vat_id_snapshot,
    },
    notes: r.notes,
    pdfDocumentId: r.pdf_document_id,
    xrechnungDocumentId: r.xrechnung_document_id,
    lines: lines.map((l) => ({
      id: l.id,
      position: l.position,
      description: l.description,
      quantity: qtyFromDb(l.quantity),
      unit: l.unit,
      unitPrice: qtyFromDb(l.unit_price),
      taxTreatment: l.tax_treatment as InvoiceView['lines'][number]['taxTreatment'],
      taxRate: rateFromDb(l.tax_rate),
      netAmount: moneyFromDb(l.net_amount),
      taxAmount: moneyFromDb(l.tax_amount),
      grossAmount: moneyFromDb(l.gross_amount),
    })),
    finalizedAt: r.finalized_at?.toISOString() ?? null,
    cancelledAt: r.cancelled_at?.toISOString() ?? null,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

export function toInvoiceSummary(r: InvoiceRow & { client_name: string | null }): InvoiceSummary {
  const v = toInvoiceView(r, []);
  const { lines: _l, clientSnapshot: _c, notes: _n, ...rest } = v;
  return { ...rest, clientName: r.client_name_snapshot ?? r.client_name };
}

export function toFinalizeResponse(r: InvoiceRow): FinalizeInvoiceResponse {
  return {
    id: r.id,
    invoiceNumber: r.invoice_number!,
    status: r.status as FinalizeInvoiceResponse['status'],
    subtotalNet: moneyFromDb(r.subtotal_net),
    taxTotal: moneyFromDb(r.tax_total),
    grossTotal: moneyFromDb(r.gross_total),
  };
}
