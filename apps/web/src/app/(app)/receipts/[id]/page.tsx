'use client';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { ReceiptReviewForm } from '@/features/receipts/components/ReceiptReviewForm';
import { useReceipt } from '@/features/receipts/hooks';
import { useFormat } from '@/lib/format';

export default function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useReceipt(id);
  const t = useTranslations('receipts');
  const { date, eur } = useFormat();
  if (q.isLoading) return null;
  if (q.error || !q.data) return <ErrorAlert error={q.error ?? new Error(t('notFound'))} />;
  const r = q.data;
  const processing = r.status === 'UPLOADED' || r.status === 'OCR_PROCESSING';
  return (
    <>
      <PageHeader title={r.merchant ?? t('receipt')} actions={<StatusChip status={r.status} />} />
      {processing && (
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={22} />
              <Typography>{t('reading')}</Typography>
            </Stack>
          </CardContent>
        </Card>
      )}
      {(r.status === 'NEEDS_REVIEW' || r.status === 'FAILED') && (
        <Card>
          <CardContent>
            <ReceiptReviewForm
              receipt={r}
              onConfirmed={() => router.push(`/expenses/new?receiptId=${r.id}`)}
            />
          </CardContent>
        </Card>
      )}
      {r.status === 'CONFIRMED' && (
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography>
                {t('merchantLine')} <strong>{r.merchant}</strong>
              </Typography>
              <Typography>{t('dateLine', { date: date(r.receiptDate) })}</Typography>
              <Typography>
                {t('amountsLine', { net: eur(r.netAmount), tax: eur(r.taxAmount) })}{' '}
                <strong>{eur(r.grossAmount)}</strong>
              </Typography>
              {r.expenseId ? (
                <Alert
                  severity="success"
                  action={
                    <Button component={Link} href={`/expenses/${r.expenseId}`}>
                      {t('openExpense')}
                    </Button>
                  }
                >
                  {t('linkedToExpense')}
                </Alert>
              ) : (
                <Alert
                  severity="info"
                  action={
                    <Button
                      component={Link}
                      href={`/expenses/new?receiptId=${r.id}`}
                      variant="contained"
                      size="small"
                    >
                      {t('createExpense')}
                    </Button>
                  }
                >
                  {t('confirmedCreateHint')}
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </>
  );
}
