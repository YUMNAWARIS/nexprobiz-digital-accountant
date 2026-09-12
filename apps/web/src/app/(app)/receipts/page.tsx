'use client';
import { Card, MenuItem, Stack, TextField } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { RECEIPT_STATUS, type ReceiptStatus } from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { ReceiptUpload } from '@/features/receipts/components/ReceiptUpload';
import { useReceipts } from '@/features/receipts/hooks';
import { useFormat } from '@/lib/format';

function ReceiptsInner() {
  const initial = useSearchParams().get('status') as ReceiptStatus | null;
  const [status, setStatus] = useState<ReceiptStatus | ''>(initial ?? '');
  const [page, setPage] = useState(1);
  const t = useTranslations('receipts');
  const tc = useTranslations('common');
  const ts = useTranslations('status');
  const { date, eur } = useFormat();
  const q = useReceipts({ status: status || undefined, page, pageSize: 20 });
  return (
    <>
      <PageHeader title={t('title')} actions={<ReceiptUpload />} />
      <Stack direction="row" sx={{ mb: 2 }}>
        <TextField
          size="small"
          select
          label={tc('status')}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ReceiptStatus | '');
            setPage(1);
          }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">{tc('all')}</MenuItem>
          {RECEIPT_STATUS.map((s) => (
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
          rowHref={(r) => `/receipts/${r.id}`}
          columns={[
            { key: 'merchant', header: t('merchant'), render: (r) => r.merchant ?? <em>—</em> },
            { key: 'date', header: tc('date'), render: (r) => date(r.receiptDate) },
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
            { key: 'expense', header: t('expense'), render: (r) => (r.expenseId ? '✓' : '—') },
            { key: 'created', header: t('uploaded'), render: (r) => date(r.createdAt) },
          ]}
          pagination={q.data ? { ...q.data.meta, onPageChange: setPage } : undefined}
        />
      </Card>
    </>
  );
}
export default function ReceiptsPage() {
  return (
    <Suspense>
      <ReceiptsInner />
    </Suspense>
  );
}
