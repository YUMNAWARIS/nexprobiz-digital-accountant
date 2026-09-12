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
import { useParams, useRouter } from 'next/navigation';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { ReceiptReviewForm } from '@/features/receipts/components/ReceiptReviewForm';
import { useReceipt } from '@/features/receipts/hooks';
import { date, eur } from '@/lib/format';

export default function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const q = useReceipt(id);
  if (q.isLoading) return null;
  if (q.error || !q.data)
    return <ErrorAlert error={q.error ?? new Error('Beleg nicht gefunden')} />;
  const r = q.data;
  const processing = r.status === 'UPLOADED' || r.status === 'OCR_PROCESSING';
  return (
    <>
      <PageHeader title={r.merchant ?? 'Beleg'} actions={<StatusChip status={r.status} />} />
      {processing && (
        <Card>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={22} />
              <Typography>Beleg wird gelesen …</Typography>
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
                Händler: <strong>{r.merchant}</strong>
              </Typography>
              <Typography>Datum: {date(r.receiptDate)}</Typography>
              <Typography>
                Netto {eur(r.netAmount)} · USt {eur(r.taxAmount)} · Brutto{' '}
                <strong>{eur(r.grossAmount)}</strong>
              </Typography>
              {r.expenseId ? (
                <Alert
                  severity="success"
                  action={
                    <Button component={Link} href={`/expenses/${r.expenseId}`}>
                      Ausgabe öffnen
                    </Button>
                  }
                >
                  Beleg ist einer Ausgabe zugeordnet.
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
                      Ausgabe anlegen
                    </Button>
                  }
                >
                  Bestätigt — jetzt eine Ausgabe daraus erstellen.
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </>
  );
}
