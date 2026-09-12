'use client';
import AddIcon from '@mui/icons-material/Add';
import { Button, Card, MenuItem, Stack, TextField } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { EXPENSE_STATUS, type ExpenseStatus } from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { useCategoryName, useExpenses } from '@/features/expenses/hooks';
import { useFormat } from '@/lib/format';

function ExpensesInner() {
  const initial = useSearchParams().get('status') as ExpenseStatus | null;
  const [status, setStatus] = useState<ExpenseStatus | ''>(initial ?? '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const t = useTranslations('expenses');
  const tc = useTranslations('common');
  const ts = useTranslations('status');
  const { date, eur } = useFormat();
  const categoryName = useCategoryName();
  const q = useExpenses({
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
          <Button component={Link} href="/expenses/new" variant="contained" startIcon={<AddIcon />}>
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
          sx={{ minWidth: 240 }}
        />
        <TextField
          size="small"
          select
          label={tc('status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ExpenseStatus | '');
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{tc('all')}</MenuItem>
          {EXPENSE_STATUS.map((s) => (
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
          rowHref={(r) => `/expenses/${r.id}`}
          columns={[
            { key: 'date', header: tc('date'), render: (r) => date(r.expenseDate) },
            { key: 'merchant', header: t('merchant'), render: (r) => r.merchant },
            {
              key: 'cat',
              header: t('category'),
              render: (r) => categoryName(r.categoryId, r.categoryName),
            },
            { key: 'net', header: tc('net'), align: 'right', render: (r) => eur(r.netAmount) },
            {
              key: 'gross',
              header: tc('gross'),
              align: 'right',
              render: (r) => eur(r.grossAmount),
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
export default function ExpensesPage() {
  return (
    <Suspense>
      <ExpensesInner />
    </Suspense>
  );
}
