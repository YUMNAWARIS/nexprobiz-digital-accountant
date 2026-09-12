'use client';
import { Card, CardContent } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClientForm } from '@/features/clients/components/ClientForm';
import { useCreateClient } from '@/features/clients/hooks';

export default function NewClientPage() {
  const router = useRouter();
  const create = useCreateClient();
  const t = useTranslations('clients');
  return (
    <>
      <PageHeader title={t('new')} />
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
