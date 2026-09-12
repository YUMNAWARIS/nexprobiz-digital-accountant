'use client';
import AddIcon from '@mui/icons-material/Add';
import { Button, Card, MenuItem, Stack, TextField } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { EXPENSE_STATUS, type ExpenseStatus } from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { useExpenses } from '@/features/expenses/hooks';
import { date, eur } from '@/lib/format';

function ExpensesInner() {
  const initial = useSearchParams().get('status') as ExpenseStatus | null;
  const [status, setStatus] = useState<ExpenseStatus | ''>(initial ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useExpenses({
    status: status || undefined,
    search: search || undefined,
    page,
    pageSize: 20,
  });
  return (
    <>
      <PageHeader
        title="Ausgaben"
        actions={
          <Button component={Link} href="/expenses/new" variant="contained" startIcon={<AddIcon />}>
            Neue Ausgabe
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
          sx={{ minWidth: 240 }}
        />
        <TextField
          size="small"
          select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ExpenseStatus | '');
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Alle</MenuItem>
          {EXPENSE_STATUS.map((s) => (
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
          rowHref={(r) => `/expenses/${r.id}`}
          columns={[
            { key: 'date', header: 'Datum', render: (r) => date(r.expenseDate) },
            { key: 'merchant', header: 'Händler', render: (r) => r.merchant },
            { key: 'cat', header: 'Kategorie', render: (r) => r.categoryName },
            { key: 'net', header: 'Netto', align: 'right', render: (r) => eur(r.netAmount) },
            { key: 'gross', header: 'Brutto', align: 'right', render: (r) => eur(r.grossAmount) },
            { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
          ]}
          pagination={q.data ? { ...q.data.meta, onPageChange: setPage } : undefined}
        />
      </Card>
    </>
  );
}
export default function ExpensesPage() {
  return (
    <Suspense>
      <ExpensesInner />
    </Suspense>
  );
}
