'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import CheckIcon from '@mui/icons-material/Check';
import UndoIcon from '@mui/icons-material/Undo';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ReverseExpenseRequest } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { ExpenseForm } from '@/features/expenses/components/ExpenseForm';
import {
  useExpense,
  usePostExpense,
  useReverseExpense,
  useUpdateExpense,
} from '@/features/expenses/hooks';
import { date, eur } from '@/lib/format';

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useExpense(id);
  const update = useUpdateExpense(id);
  const post = usePostExpense(id);
  const reverse = useReverseExpense(id);
  const [revOpen, setRevOpen] = useState(false);
  const revForm = useForm<
    z.input<typeof ReverseExpenseRequest>,
    unknown,
    z.output<typeof ReverseExpenseRequest>
  >({ resolver: zodResolver(ReverseExpenseRequest), defaultValues: { reason: '' } });
  if (q.isLoading) return null;
  if (q.error || !q.data)
    return <ErrorAlert error={q.error ?? new Error('Ausgabe nicht gefunden')} />;
  const e = q.data;
  return (
    <>
      <PageHeader
        title={`${e.merchant} · ${eur(e.grossAmount)}`}
        subtitle={`${e.categoryName} · ${date(e.expenseDate)}`}
        actions={
          <>
            <StatusChip status={e.status} />
            {e.status === 'DRAFT' && (
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                disabled={post.isPending}
                onClick={() => {
                  if (
                    confirm(
                      'Ausgabe buchen? Danach ist sie unveränderlich (Korrektur nur per Storno).',
                    )
                  )
                    post.mutate();
                }}
              >
                Buchen
              </Button>
            )}
            {e.status === 'POSTED' && (
              <Button color="error" startIcon={<UndoIcon />} onClick={() => setRevOpen(true)}>
                Stornieren
              </Button>
            )}
            {e.receiptId && (
              <Button component={Link} href={`/receipts/${e.receiptId}`}>
                Beleg
              </Button>
            )}
          </>
        }
      />
      <ErrorAlert error={post.error ?? reverse.error} />
      {e.status === 'DRAFT' ? (
        <Card>
          <CardContent>
            <ExpenseForm
              current={e}
              onSubmit={(v) => update.mutate(v)}
              pending={update.isPending}
              error={update.error}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Stack spacing={1}>
              {e.status === 'REVERSED' && (
                <Alert severity="warning">
                  Storniert am {date(e.reversedAt)} — die ursprüngliche Buchung bleibt erhalten,
                  eine Gegenbuchung neutralisiert sie.
                </Alert>
              )}
              <Typography>
                Netto {eur(e.netAmount)} · USt {eur(e.taxAmount)} · Brutto{' '}
                <strong>{eur(e.grossAmount)}</strong>
              </Typography>
              <Typography>
                Steuer: {e.taxTreatment} · Geschäftlicher Anteil: {e.businessPercentage} %
              </Typography>
              {e.description && <Typography color="text.secondary">{e.description}</Typography>}
              <Typography variant="caption" color="text.secondary">
                Gebucht am {date(e.postedAt)} · Journal {e.journalEntryId?.slice(0, 8)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}
      <Dialog open={revOpen} onClose={() => setRevOpen(false)} fullWidth maxWidth="sm">
        <form
          onSubmit={revForm.handleSubmit((v) =>
            reverse.mutate(v, { onSuccess: () => setRevOpen(false) }),
          )}
        >
          <DialogTitle>Ausgabe stornieren</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormTextField
                control={revForm.control}
                name="reason"
                label="Grund"
                multiline
                minRows={2}
                autoFocus
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRevOpen(false)}>Abbrechen</Button>
            <Button type="submit" color="error" variant="contained" disabled={reverse.isPending}>
              Stornieren
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
