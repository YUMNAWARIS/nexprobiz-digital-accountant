'use client';
import ArchiveIcon from '@mui/icons-material/Archive';
import { Alert, Button, Card, CardContent } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { ClientForm } from '@/features/clients/components/ClientForm';
import { useArchiveClient, useClient, useUpdateClient } from '@/features/clients/hooks';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useClient(id);
  const update = useUpdateClient(id);
  const archive = useArchiveClient();
  const t = useTranslations('clients');
  if (q.isLoading) return null;
  if (q.error || !q.data) return <ErrorAlert error={q.error ?? new Error(t('notFound'))} />;
  const c = q.data;
  return (
    <>
      <PageHeader
        title={c.name}
        actions={
          <>
            <StatusChip status={c.status} />
            {c.status === 'ACTIVE' && (
              <Button
                color="warning"
                startIcon={<ArchiveIcon />}
                disabled={archive.isPending}
                onClick={() => {
                  if (confirm(t('archiveConfirm')))
                    archive.mutate(id, { onSuccess: () => router.push('/clients') });
                }}
              >
                {t('archive')}
              </Button>
            )}
          </>
        }
      />
      {c.status === 'ARCHIVED' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('archivedReadOnly')}
        </Alert>
      )}
      <Card>
        <CardContent>
          {c.status === 'ACTIVE' ? (
            <ClientForm
              current={c}
              onSubmit={(v) => update.mutate(v)}
              pending={update.isPending}
              error={update.error}
            />
          ) : (
            <ClientForm current={c} onSubmit={() => {}} pending error={null} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
