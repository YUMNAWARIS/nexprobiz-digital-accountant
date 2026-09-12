/** §14 Invoice State Machine */
import type { InvoiceStatus } from '@fa/contracts';

const TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  DRAFT: ['FINALIZED'],
  FINALIZED: ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
  PARTIALLY_PAID: ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
  PAID: ['CANCELLED'],
  CANCELLED: [],
};
export function canTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return TRANSITIONS[from].includes(to);
}
export const isEditable = (s: InvoiceStatus): boolean => s === 'DRAFT';
export const isImmutable = (s: InvoiceStatus): boolean => s !== 'DRAFT';
export const acceptsPayment = (s: InvoiceStatus): boolean =>
  s === 'FINALIZED' || s === 'PARTIALLY_PAID';
export const isCancellable = (s: InvoiceStatus): boolean =>
  s === 'FINALIZED' || s === 'PARTIALLY_PAID' || s === 'PAID';
