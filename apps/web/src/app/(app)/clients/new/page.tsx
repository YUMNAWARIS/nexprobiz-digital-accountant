'use client';
import { Card, CardContent } from '@mui/material';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClientForm } from '@/features/clients/components/ClientForm';
import { useCreateClient } from '@/features/clients/hooks';

export default function NewClientPage() {
  const router = useRouter();
  const create = useCreateClient();
  return (
    <>
      <PageHeader title="Neuer Kunde" />
      <Card>
        <CardContent>
          <ClientForm
            onSubmit={(v) =>
              create.mutate(v, { onSuccess: (c) => router.replace(`/clients/${c.id}`) })
            }
            pending={create.isPending}
            error={create.error}
          />
        </CardContent>
      </Card>
    </>
  );
}
