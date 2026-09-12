'use client';
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
import { useTranslations } from 'next-intl';
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
  useCategoryName,
  useExpense,
  usePostExpense,
  useReverseExpense,
  useUpdateExpense,
} from '@/features/expenses/hooks';
import { useZodResolver } from '@/i18n/useZodResolver';
import { useFormat } from '@/lib/format';

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const q = useExpense(id);
  const update = useUpdateExpense(id);
  const post = usePostExpense(id);
  const reverse = useReverseExpense(id);
  const [revOpen, setRevOpen] = useState(false);
  const t = useTranslations('expenses');
  const tc = useTranslations('common');
  const te = useTranslations('enums');
  const { date, eur } = useFormat();
  const categoryName = useCategoryName();
  const revForm = useForm<
    z.input<typeof ReverseExpenseRequest>,
    unknown,
    z.output<typeof ReverseExpenseRequest>
  >({ resolver: useZodResolver(ReverseExpenseRequest), defaultValues: { reason: '' } });
  if (q.isLoading) return null;
  if (q.error || !q.data) return <ErrorAlert error={q.error ?? new Error(t('notFound'))} />;
  const e = q.data;
  return (
    <>
      <PageHeader
        title={`${e.merchant} · ${eur(e.grossAmount)}`}
        subtitle={`${categoryName(e.categoryId, e.categoryName)} · ${date(e.expenseDate)}`}
        actions={
          <>
            <StatusChip status={e.status} />
            {e.status === 'DRAFT' && (
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                disabled={post.isPending}
                onClick={() => {
                  if (confirm(t('postConfirm'))) post.mutate();
                }}
              >
                {t('post')}
              </Button>
            )}
            {e.status === 'POSTED' && (
              <Button color="error" startIcon={<UndoIcon />} onClick={() => setRevOpen(true)}>
                {t('reverse')}
              </Button>
            )}
            {e.receiptId && (
              <Button component={Link} href={`/receipts/${e.receiptId}`}>
                {t('receipt')}
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
                <Alert severity="warning">{t('reversedHint', { date: date(e.reversedAt) })}</Alert>
              )}
              <Typography>
                {t('amountsLine', { net: eur(e.netAmount), tax: eur(e.taxAmount) })}{' '}
                <strong>{eur(e.grossAmount)}</strong>
              </Typography>
              <Typography>
                {t('taxShareLine', { treatment: te(e.taxTreatment), pct: e.businessPercentage })}
              </Typography>
              {e.description && <Typography color="text.secondary">{e.description}</Typography>}
              <Typography variant="caption" color="text.secondary">
                {t('postedLine', {
                  date: date(e.postedAt),
                  journal: e.journalEntryId?.slice(0, 8) ?? '—',
                })}
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
          <DialogTitle>{t('reverseTitle')}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormTextField
                control={revForm.control}
                name="reason"
                label={t('reason')}
                multiline
                minRows={2}
                autoFocus
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRevOpen(false)}>{tc('cancel')}</Button>
            <Button type="submit" color="error" variant="contained" disabled={reverse.isPending}>
              {t('reverse')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
