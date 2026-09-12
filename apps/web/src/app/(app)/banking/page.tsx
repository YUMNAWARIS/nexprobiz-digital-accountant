'use client';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Button, Card, Chip, MenuItem, Select, Stack, TextField } from '@mui/material';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import {
  BANK_CLASSIFICATION,
  type BankClassification,
  type BankTransactionView,
} from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip, useStatusLabel } from '@/components/ui/StatusChip';
import { ReconcileDialog } from '@/features/banking/components/ReconcileDialog';
import { useBankTransactions, useClassifyBankTransaction } from '@/features/banking/hooks';
import { useFormat } from '@/lib/format';

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
  const t = useTranslations('banking');
  const tc = useTranslations('common');
  const { date, eur } = useFormat();
  const LABEL = useStatusLabel();
  return (
    <>
      <PageHeader
        title={t('title')}
        actions={
          <Button
            component={Link}
            href="/banking/import"
            variant="contained"
            startIcon={<UploadFileIcon />}
          >
            {t('importCsv')}
          </Button>
        }
      />
      <ErrorAlert error={classify.error} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          select
          label={t('classification')}
          value={classification}
          onChange={(e) => {
            setClassification(e.target.value as BankClassification | '');
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{tc('all')}</MenuItem>
          {BANK_CLASSIFICATION.map((c) => (
            <MenuItem key={c} value={c}>
              {LABEL(c)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          select
          label={t('reconciliation')}
          value={reconciled}
          onChange={(e) => {
            setReconciled(e.target.value as '' | 'true' | 'false');
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{tc('all')}</MenuItem>
          <MenuItem value="false">{t('openOnly')}</MenuItem>
          <MenuItem value="true">{t('reconciledOnly')}</MenuItem>
        </TextField>
        <TextField
          size="small"
          type="date"
          label={tc('from')}
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
          label={tc('to')}
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
            { key: 'date', header: t('booking'), render: (r) => date(r.bookingDate) },
            { key: 'desc', header: t('purpose'), render: (r) => r.description },
            { key: 'cp', header: t('counterparty'), render: (r) => r.counterparty ?? '—' },
            { key: 'amount', header: tc('amount'), align: 'right', render: (r) => eur(r.amount) },
            {
              key: 'class',
              header: t('classification'),
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
                      {LABEL(c)}
                    </MenuItem>
                  ))}
                </Select>
              ),
            },
            {
              key: 'recon',
              header: t('reconciliation'),
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
                    label={
                      r.reconciliation.targetType === 'EXPENSE'
                        ? t('expenseChip')
                        : t('paymentChip')
                    }
                  />
                ) : r.classification === 'BUSINESS' ? (
                  <Button size="small" onClick={() => setReconcileTx(r)}>
                    {t('reconcile')}
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
