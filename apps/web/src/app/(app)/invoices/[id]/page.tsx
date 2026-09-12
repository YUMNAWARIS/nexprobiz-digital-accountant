'use client';
import { useParams } from 'next/navigation';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { InvoiceDetail } from '@/features/invoices/components/InvoiceDetail';
import { useInvoice } from '@/features/invoices/hooks';

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useInvoice(id);
  if (q.isLoading) return null;
  if (q.error || !q.data)
    return <ErrorAlert error={q.error ?? new Error('Rechnung nicht gefunden')} />;
  return (
    <>
      <PageHeader
        title={q.data.invoiceNumber ? `Rechnung ${q.data.invoiceNumber}` : 'Rechnungsentwurf'}
      />
      <InvoiceDetail invoice={q.data} />
    </>
  );
}
