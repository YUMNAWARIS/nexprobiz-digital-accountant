'use client';
import { Card, MenuItem, Stack, TextField } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { RECEIPT_STATUS, type ReceiptStatus } from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { ReceiptUpload } from '@/features/receipts/components/ReceiptUpload';
import { useReceipts } from '@/features/receipts/hooks';
import { date, eur } from '@/lib/format';

function ReceiptsInner() {
  const initial = useSearchParams().get('status') as ReceiptStatus | null;
  const [status, setStatus] = useState<ReceiptStatus | ''>(initial ?? '');
  const [page, setPage] = useState(1);
  const q = useReceipts({ status: status || undefined, page, pageSize: 20 });
  return (
    <>
      <PageHeader title="Belege" actions={<ReceiptUpload />} />
      <Stack direction="row" sx={{ mb: 2 }}>
        <TextField
          size="small"
          select
          label="Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ReceiptStatus | '');
            setPage(1);
          }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Alle</MenuItem>
          {RECEIPT_STATUS.map((s) => (
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
          rowHref={(r) => `/receipts/${r.id}`}
          columns={[
            { key: 'merchant', header: 'Händler', render: (r) => r.merchant ?? <em>—</em> },
            { key: 'date', header: 'Datum', render: (r) => date(r.receiptDate) },
            { key: 'gross', header: 'Brutto', align: 'right', render: (r) => eur(r.grossAmount) },
            { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
            { key: 'expense', header: 'Ausgabe', render: (r) => (r.expenseId ? '✓' : '—') },
            { key: 'created', header: 'Hochgeladen', render: (r) => date(r.createdAt) },
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
