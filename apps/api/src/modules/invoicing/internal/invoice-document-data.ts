import type { BusinessProfileView, InvoiceView } from '@fa/contracts';

/** Everything a document renderer needs. Built from the FINALIZED invoice + its bound profile version. */
export interface InvoiceDocumentData {
  invoice: InvoiceView;
  seller: BusinessProfileView;
}
export const KLEINUNTERNEHMER_TEXT = 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.';
