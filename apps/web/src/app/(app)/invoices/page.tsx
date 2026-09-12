'use client';
import AddIcon from '@mui/icons-material/Add';
import { Button, Card, MenuItem, Stack, TextField } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { INVOICE_STATUS, type InvoiceStatus } from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { useInvoices } from '@/features/invoices/hooks';
import { date, eur } from '@/lib/format';

function InvoicesPageInner() {
  const initial = useSearchParams().get('status') as InvoiceStatus | null;
  const [status, setStatus] = useState<InvoiceStatus | ''>(initial ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useInvoices({
    status: status || undefined,
    search: search || undefined,
    page,
    pageSize: 20,
  });
  return (
    <>
      <PageHeader
        title="Rechnungen"
        actions={
          <Button component={Link} href="/invoices/new" variant="contained" startIcon={<AddIcon />}>
            Neue Rechnung
          </Button>
        }
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Suchen (Nummer, Kunde)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 260 }}
        />
        <TextField
          size="small"
          select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as InvoiceStatus | '');
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Alle</MenuItem>
          {INVOICE_STATUS.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Card>
        <DataTable
          rows={q.data?.data ?? []}
          loading={q.isLoading}
          error={q.error}
          getRowId={(r) => r.id}
          rowHref={(r) => `/invoices/${r.id}`}
          columns={[
            { key: 'number', header: 'Nummer', render: (r) => r.invoiceNumber ?? <em>Entwurf</em> },
            { key: 'client', header: 'Kunde', render: (r) => r.clientName ?? '—' },
            { key: 'issue', header: 'Datum', render: (r) => date(r.issueDate) },
            { key: 'due', header: 'Fällig', render: (r) => date(r.dueDate) },
            { key: 'gross', header: 'Brutto', align: 'right', render: (r) => eur(r.grossTotal) },
            {
              key: 'open',
              header: 'Offen',
              align: 'right',
              render: (r) => eur(r.outstandingAmount),
            },
            { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
          ]}
          pagination={q.data ? { ...q.data.meta, onPageChange: setPage } : undefined}
        />
      </Card>
    </>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesPageInner />
    </Suspense>
  );
}
