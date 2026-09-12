'use client';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { InvoiceDetail } from '@/features/invoices/components/InvoiceDetail';
import { useInvoice } from '@/features/invoices/hooks';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useInvoice(id);
  const t = useTranslations('invoices');
  if (q.isLoading) return null;
  if (q.error || !q.data) return <ErrorAlert error={q.error ?? new Error(t('notFound'))} />;
  return (
    <>
      <PageHeader
        title={
          q.data.invoiceNumber
            ? t('invoiceTitle', { number: q.data.invoiceNumber })
            : t('draftTitle')
        }
      />
      <InvoiceDetail invoice={q.data} />
    </>
  );
}
