'use client';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Button, Card, Chip, MenuItem, Select, Stack, TextField } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import {
  BANK_CLASSIFICATION,
  type BankClassification,
  type BankTransactionView,
} from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { ReconcileDialog } from '@/features/banking/components/ReconcileDialog';
import { useBankTransactions, useClassifyBankTransaction } from '@/features/banking/hooks';
import { date, eur } from '@/lib/format';

const LABEL: Record<BankClassification, string> = {
  UNREVIEWED: 'Ungeprüft',
  BUSINESS: 'Geschäftlich',
  PERSONAL: 'Privat',
  TRANSFER: 'Umbuchung',
};

function BankingInner() {
  const initial = useSearchParams().get('classification') as BankClassification | null;
  const [classification, setClassification] = useState<BankClassification | ''>(initial ?? '');
  const [reconciled, setReconciled] = useState<'' | 'true' | 'false'>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [reconcileTx, setReconcileTx] = useState<BankTransactionView | null>(null);
  const q = useBankTransactions({
    classification: classification || undefined,
    reconciled: reconciled || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: 20,
  });
  const classify = useClassifyBankTransaction();
  return (
    <>
      <PageHeader
        title="Bank"
        actions={
          <Button
            component={Link}
            href="/banking/import"
            variant="contained"
            startIcon={<UploadFileIcon />}
          >
            CSV importieren
          </Button>
        }
      />
      <ErrorAlert error={classify.error} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          select
          label="Klassifizierung"
          value={classification}
          onChange={(e) => {
            setClassification(e.target.value as BankClassification | '');
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Alle</MenuItem>
          {BANK_CLASSIFICATION.map((c) => (
            <MenuItem key={c} value={c}>
              {LABEL[c]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label="Abgleich"
          value={reconciled}
          onChange={(e) => {
            setReconciled(e.target.value as '' | 'true' | 'false');
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Alle</MenuItem>
          <MenuItem value="false">Offen</MenuItem>
          <MenuItem value="true">Abgeglichen</MenuItem>
        </TextField>
        <TextField
          size="small"
          type="date"
          label="Von"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small"
          type="date"
          label="Bis"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>
      <Card>
        <DataTable
          rows={q.data?.data ?? []}
          loading={q.isLoading}
          error={q.error}
          getRowId={(r) => r.id}
          columns={[
            { key: 'date', header: 'Buchung', render: (r) => date(r.bookingDate) },
            { key: 'desc', header: 'Verwendungszweck', render: (r) => r.description },
            { key: 'cp', header: 'Gegenpartei', render: (r) => r.counterparty ?? '—' },
            { key: 'amount', header: 'Betrag', align: 'right', render: (r) => eur(r.amount) },
            {
              key: 'class',
              header: 'Klassifizierung',
              render: (r) => (
                <Select
                  size="small"
                  value={r.classification}
                  disabled={classify.isPending || !!r.reconciliation}
                  onChange={(e) =>
                    classify.mutate({
                      id: r.id,
                      classification: e.target.value as BankClassification,
                    })
                  }
                  sx={{ minWidth: 150 }}
                >
                  {BANK_CLASSIFICATION.map((c) => (
                    <MenuItem key={c} value={c}>
                      {LABEL[c]}
                    </MenuItem>
                  ))}
                </Select>
              ),
            },
            {
              key: 'recon',
              header: 'Abgleich',
              render: (r) =>
                r.reconciliation ? (
                  <Chip
                    size="small"
                    color="success"
                    component={Link}
                    clickable
                    href={
                      r.reconciliation.targetType === 'EXPENSE'
                        ? `/expenses/${r.reconciliation.targetId}`
                        : '/invoices?status=PAID'
                    }
                    label={r.reconciliation.targetType === 'EXPENSE' ? 'Ausgabe' : 'Zahlung'}
                  />
                ) : r.classification === 'BUSINESS' ? (
                  <Button size="small" onClick={() => setReconcileTx(r)}>
                    Abgleichen
                  </Button>
                ) : (
                  <StatusChip status={r.classification} />
                ),
            },
          ]}
          pagination={q.data ? { ...q.data.meta, onPageChange: setPage } : undefined}
        />
      </Card>
      <ReconcileDialog tx={reconcileTx} onClose={() => setReconcileTx(null)} />
    </>
  );
}
export default function BankingPage() {
  return (
    <Suspense>
      <BankingInner />
    </Suspense>
  );
}
