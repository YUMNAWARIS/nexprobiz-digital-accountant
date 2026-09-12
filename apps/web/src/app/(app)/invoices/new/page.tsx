'use client';
import { Card, CardContent } from '@mui/material';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { InvoiceForm } from '@/features/invoices/components/InvoiceForm';
import { useCreateInvoice } from '@/features/invoices/hooks';

export default function NewInvoicePage() {
  const router = useRouter();
  const create = useCreateInvoice();
  return (
    <>
      <PageHeader
        title="Neue Rechnung"
        subtitle="Wird als Entwurf gespeichert und kann bis zur Finalisierung bearbeitet werden."
      />
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
