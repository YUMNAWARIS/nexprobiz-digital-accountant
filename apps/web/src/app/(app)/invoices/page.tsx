'use client';
import AddIcon from '@mui/icons-material/Add';
import { Button, Card, MenuItem, Stack, TextField } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { INVOICE_STATUS, type InvoiceStatus } from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { useInvoices } from '@/features/invoices/hooks';
import { useFormat } from '@/lib/format';

function InvoicesPageInner() {
  const initial = useSearchParams().get('status') as InvoiceStatus | null;
  const [status, setStatus] = useState<InvoiceStatus | ''>(initial ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const t = useTranslations('invoices');
  const tc = useTranslations('common');
  const ts = useTranslations('status');
  const { date, eur } = useFormat();
  const q = useInvoices({
    status: status || undefined,
    search: search || undefined,
    page,
    pageSize: 20,
  });
  return (
    <>
      <PageHeader
        title={t('title')}
        actions={
          <Button component={Link} href="/invoices/new" variant="contained" startIcon={<AddIcon />}>
            {t('new')}
          </Button>
        }
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label={t('searchLabel')}
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
          label={tc('status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as InvoiceStatus | '');
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{tc('all')}</MenuItem>
          {INVOICE_STATUS.map((s) => (
            <MenuItem key={s} value={s}>
              {ts(s)}
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
            {
              key: 'number',
              header: t('number'),
              render: (r) => r.invoiceNumber ?? <em>{t('draft')}</em>,
            },
            { key: 'client', header: t('client'), render: (r) => r.clientName ?? '—' },
            { key: 'issue', header: tc('date'), render: (r) => date(r.issueDate) },
            { key: 'due', header: t('due'), render: (r) => date(r.dueDate) },
            { key: 'gross', header: tc('gross'), align: 'right', render: (r) => eur(r.grossTotal) },
            {
              key: 'open',
              header: t('open'),
              align: 'right',
              render: (r) => eur(r.outstandingAmount),
            },
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

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesPageInner />
    </Suspense>
  );
}
