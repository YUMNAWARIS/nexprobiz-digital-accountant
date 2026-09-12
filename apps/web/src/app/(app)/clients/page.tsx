'use client';
import AddIcon from '@mui/icons-material/Add';
import { Button, Card, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import Link from 'next/link';
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
  const q = useClients({ search: search || undefined, status, page, pageSize: 20 });
  return (
    <>
      <PageHeader
        title="Kunden"
        actions={
          <Button component={Link} href="/clients/new" variant="contained" startIcon={<AddIcon />}>
            Neuer Kunde
          </Button>
        }
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Suchen"
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
          <ToggleButton value="ACTIVE">Aktiv</ToggleButton>
          <ToggleButton value="ARCHIVED">Archiviert</ToggleButton>
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
            { key: 'name', header: 'Name', render: (r) => r.name },
            { key: 'contact', header: 'Ansprechpartner', render: (r) => r.contactName ?? '—' },
            { key: 'email', header: 'E-Mail', render: (r) => r.email ?? '—' },
            { key: 'city', header: 'Ort', render: (r) => r.city ?? '—' },
            { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
          ]}
          pagination={q.data ? { ...q.data.meta, onPageChange: setPage } : undefined}
        />
      </Card>
    </>
  );
}
