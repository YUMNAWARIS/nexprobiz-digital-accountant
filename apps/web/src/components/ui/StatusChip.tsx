'use client';
import { Chip } from '@mui/material';
import { useTranslations } from 'next-intl';
const COLORS: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default',
  FINALIZED: 'primary',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  CANCELLED: 'error',
  POSTED: 'success',
  REVERSED: 'error',
  UPLOADED: 'default',
  OCR_PROCESSING: 'info',
  NEEDS_REVIEW: 'warning',
  CONFIRMED: 'success',
  FAILED: 'error',
  UNREVIEWED: 'default',
  BUSINESS: 'primary',
  PERSONAL: 'default',
  TRANSFER: 'info',
  ACTIVE: 'success',
  ARCHIVED: 'default',
  COMPLETED: 'success',
  PENDING: 'info',
};
/** Localized label for any status/classification enum value (messages: `status.*`). */
export function useStatusLabel() {
  const t = useTranslations('status');
  return (status: string) => (t.has(status) ? t(status) : status);
}
export function StatusChip({ status }: { status: string }) {
  const label = useStatusLabel();
  return <Chip size="small" label={label(status)} color={COLORS[status] ?? 'default'} />;
}
