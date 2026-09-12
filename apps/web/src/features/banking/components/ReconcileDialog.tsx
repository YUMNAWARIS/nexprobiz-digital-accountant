'use client';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { BankTransactionView, ReconciliationTarget } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { useExpenses } from '@/features/expenses/hooks';
import { useInvoicePayments, useInvoices } from '@/features/invoices/hooks';
import { useFormat } from '@/lib/format';
import { useReconcile } from '../hooks';

/**
 * §28 — POST /reconciliations. PAYMENT: choose an invoice, then one of its recorded payments.
 * EXPENSE: choose a POSTED expense. Amount must match exactly (server enforces, 409 on mismatch).
 */
export function ReconcileDialog({
  tx,
  onClose,
}: {
  tx: BankTransactionView | null;
  onClose: () => void;
}) {
  const [targetType, setTargetType] = useState<ReconciliationTarget>('PAYMENT');
  const [invoiceId, setInvoiceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const invoices = useInvoices({ pageSize: 100 });
  const payments = useInvoicePayments(invoiceId);
  const expenses = useExpenses({ status: 'POSTED', pageSize: 100 });
  const reconcile = useReconcile();
  const t = useTranslations('banking');
  const tc = useTranslations('common');
  const te = useTranslations('enums');
  const { date, eur } = useFormat();
  const reset = () => {
    setInvoiceId('');
    setTargetId('');
    reconcile.reset();
  };
  const open = !!tx;
  const isIncoming = tx ? !tx.amount.startsWith('-') : true;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('dialogTitle')}</DialogTitle>
      <DialogContent>
        {tx && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              {date(tx.bookingDate)} · {tx.description} · <strong>{eur(tx.amount)}</strong>
            </Typography>
            {tx.classification !== 'BUSINESS' && (
              <Alert severity="warning">{t('onlyBusiness')}</Alert>
            )}
            <TextField
              select
              label={t('target')}
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as ReconciliationTarget);
                reset();
              }}
            >
              <MenuItem value="PAYMENT">{t('targetPayment')}</MenuItem>
              <MenuItem value="EXPENSE">{t('targetExpense')}</MenuItem>
            </TextField>
            {targetType === 'PAYMENT' ? (
              <>
                <TextField
                  select
                  label={t('invoice')}
                  value={invoiceId}
                  onChange={(e) => {
                    setInvoiceId(e.target.value);
                    setTargetId('');
                  }}
                >
                  {(invoices.data?.data ?? [])
                    .filter((i) => i.invoiceNumber)
                    .map((i) => (
                      <MenuItem key={i.id} value={i.id}>
                        {i.invoiceNumber} · {i.clientName} · {eur(i.grossTotal)}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  select
                  label={t('payment')}
                  value={targetId}
                  disabled={!invoiceId}
                  onChange={(e) => setTargetId(e.target.value)}
                >
                  {(payments.data?.data ?? []).map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {date(p.paymentDate)} · {eur(p.amount)} · {p.reference ?? te(p.paymentMethod)}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            ) : (
              <TextField
                select
                label={t('postedExpense')}
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
              >
                {(expenses.data?.data ?? []).map((x) => (
                  <MenuItem key={x.id} value={x.id}>
                    {date(x.expenseDate)} · {x.merchant} · {eur(x.grossAmount)}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {!isIncoming && targetType === 'PAYMENT' && (
              <Alert severity="info">{t('outgoingHint')}</Alert>
            )}
            <ErrorAlert error={reconcile.error} />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{tc('cancel')}</Button>
        <Button
          variant="contained"
          disabled={!tx || !targetId || reconcile.isPending}
          onClick={() =>
            tx &&
            reconcile.mutate(
              { bankTransactionId: tx.id, targetType, targetId },
              {
                onSuccess: () => {
                  reset();
                  onClose();
                },
              },
            )
          }
        >
          {t('reconcile')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
