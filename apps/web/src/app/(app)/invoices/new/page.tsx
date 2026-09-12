'use client';
import { Card, CardContent } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { InvoiceForm } from '@/features/invoices/components/InvoiceForm';
import { useCreateInvoice } from '@/features/invoices/hooks';

export default function NewInvoicePage() {
  const router = useRouter();
  const create = useCreateInvoice();
  const t = useTranslations('invoices');
  return (
    <>
      <PageHeader title={t('new')} subtitle={t('newSubtitle')} />
      <Card>
        <CardContent>
          <InvoiceForm
            onSubmit={(v) =>
              create.mutate(v, { onSuccess: (i) => router.replace(`/invoices/${i.id}`) })
            }
            pending={create.isPending}
            error={create.error}
          />
        </CardContent>
      </Card>
    </>
  );
}
