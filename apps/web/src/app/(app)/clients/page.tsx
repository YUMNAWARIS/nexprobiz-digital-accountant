'use client';
import AddIcon from '@mui/icons-material/Add';
import { Button, Card, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { ClientStatus } from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { useClients } from '@/features/clients/hooks';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ClientStatus>('ACTIVE');
  const [page, setPage] = useState(1);
  const t = useTranslations('clients');
  const tc = useTranslations('common');
  const ts = useTranslations('status');
  const q = useClients({ search: search || undefined, status, page, pageSize: 20 });
  return (
    <>
      <PageHeader
        title={t('title')}
        actions={
          <Button component={Link} href="/clients/new" variant="contained" startIcon={<AddIcon />}>
            {t('new')}
          </Button>
        }
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label={tc('search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 260 }}
        />
        <ToggleButtonGroup
          size="small"
          exclusive
          value={status}
          onChange={(_, v: ClientStatus | null) => v && setStatus(v)}
        >
          <ToggleButton value="ACTIVE">{ts('ACTIVE')}</ToggleButton>
          <ToggleButton value="ARCHIVED">{ts('ARCHIVED')}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Card>
        <DataTable
          rows={q.data?.data ?? []}
          loading={q.isLoading}
          error={q.error}
          getRowId={(r) => r.id}
          rowHref={(r) => `/clients/${r.id}`}
          columns={[
            { key: 'name', header: t('name'), render: (r) => r.name },
            { key: 'contact', header: t('contact'), render: (r) => r.contactName ?? '—' },
            { key: 'email', header: t('email'), render: (r) => r.email ?? '—' },
            { key: 'city', header: t('city'), render: (r) => r.city ?? '—' },
            {
              key: 'status',
              header: tc('status'),
              render: (r) => <StatusChip status={r.status} />,
            },
          ]}
          pagination={q.data ? { ...q.data.meta, onPageChange: setPage } : undefined}
        />
      </Card>
    </>
  );
}
