'use client';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import PaymentsIcon from '@mui/icons-material/Payments';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  CancelInvoiceRequest,
  PAYMENT_METHOD,
  RecordPaymentRequest,
  type InvoiceView,
} from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { StatusChip } from '@/components/ui/StatusChip';
import { useZodResolver } from '@/i18n/useZodResolver';
import { useFormat } from '@/lib/format';
import {
  useCancelInvoice,
  useFinalizeInvoice,
  useInvoicePayments,
  useRecordPayment,
} from '../hooks';
import { invoicesApi } from '../api';
import { InvoiceForm } from './InvoiceForm';
import { useUpdateInvoice } from '../hooks';
import { Controller } from 'react-hook-form';

export function InvoiceDetail({ invoice: inv }: { invoice: InvoiceView }) {
  const [editing, setEditing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const finalize = useFinalizeInvoice(inv.id);
  const cancel = useCancelInvoice(inv.id);
  const update = useUpdateInvoice(inv.id);
  const pay = useRecordPayment(inv.id);
  const payments = useInvoicePayments(inv.id);
  const t = useTranslations('invoices');
  const tc = useTranslations('common');
  const te = useTranslations('enums');
  const { date, eur, pct } = useFormat();
  const cancelForm = useForm<
    z.input<typeof CancelInvoiceRequest>,
    unknown,
    z.output<typeof CancelInvoiceRequest>
  >({ resolver: useZodResolver(CancelInvoiceRequest), defaultValues: { reason: '' } });
  const payForm = useForm<
    z.input<typeof RecordPaymentRequest>,
    unknown,
    z.output<typeof RecordPaymentRequest>
  >({
    resolver: useZodResolver(RecordPaymentRequest),
    defaultValues: {
      amount: inv.outstandingAmount,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'BANK_TRANSFER',
      reference: null,
    },
  });
  const isDraft = inv.status === 'DRAFT';
  const canPay = inv.status === 'FINALIZED' || inv.status === 'PARTIALLY_PAID';
  const canCancel = inv.status !== 'DRAFT' && inv.status !== 'CANCELLED';
  const docsReady = Boolean(inv.pdfDocumentId && inv.xrechnungDocumentId);

  if (editing && isDraft) {
    return (
      <Card>
        <CardContent>
          <InvoiceForm
            current={inv}
            onSubmit={(v) => update.mutate(v, { onSuccess: () => setEditing(false) })}
            pending={update.isPending}
            error={update.error}
          />
          <Button onClick={() => setEditing(false)} sx={{ mt: 1 }}>
            {tc('cancel')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Stack spacing={2}>
      <ErrorAlert error={finalize.error ?? cancel.error ?? pay.error} />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <StatusChip status={inv.status} />
        {isDraft && (
          <Button startIcon={<EditIcon />} onClick={() => setEditing(true)}>
            {t('edit')}
          </Button>
        )}
        {isDraft && (
          <Button
            variant="contained"
            startIcon={<CheckIcon />}
            disabled={finalize.isPending}
            onClick={() => {
              if (confirm(t('finalizeConfirm'))) finalize.mutate();
            }}
          >
            {t('finalize')}
          </Button>
        )}
        {!isDraft && (
          <Button
            startIcon={<DownloadIcon />}
            disabled={!inv.pdfDocumentId}
            onClick={() => invoicesApi.downloadPdf(inv.id, inv.invoiceNumber!)}
          >
            PDF
          </Button>
        )}
        {!isDraft && (
          <Button
            startIcon={<DownloadIcon />}
            disabled={!inv.xrechnungDocumentId}
            onClick={() => invoicesApi.downloadXRechnung(inv.id, inv.invoiceNumber!)}
          >
            XRechnung
          </Button>
        )}
        {canPay && (
          <Button variant="outlined" startIcon={<PaymentsIcon />} onClick={() => setPayOpen(true)}>
            {t('recordPayment')}
          </Button>
        )}
        {canCancel && (
          <Button color="error" startIcon={<CancelIcon />} onClick={() => setCancelOpen(true)}>
            {t('cancel')}
          </Button>
        )}
      </Stack>
      {!isDraft && !docsReady && <Alert severity="info">{t('docsPending')}</Alert>}

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="overline">{t('recipient')}</Typography>
              <Typography>{inv.clientSnapshot.name ?? t('draftSnapshotHint')}</Typography>
              {inv.clientSnapshot.street && (
                <Typography variant="body2">
                  {inv.clientSnapshot.street}
                  <br />
                  {inv.clientSnapshot.postalCode} {inv.clientSnapshot.city}
                </Typography>
              )}
              {inv.clientSnapshot.vatId && (
                <Typography variant="body2">
                  {t('vatIdLine', { vatId: inv.clientSnapshot.vatId })}
                </Typography>
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="overline">{t('dates')}</Typography>
              <Typography variant="body2">
                {t('issueDateLine', { date: date(inv.issueDate) })}
              </Typography>
              <Typography variant="body2">
                {t('serviceDateLine', { date: date(inv.serviceDate) })}
              </Typography>
              <Typography variant="body2">{t('dueLine', { date: date(inv.dueDate) })}</Typography>
              {inv.finalizedAt && (
                <Typography variant="body2">
                  {t('finalizedLine', { date: date(inv.finalizedAt) })}
                </Typography>
              )}
              {inv.cancelledAt && (
                <Typography variant="body2" color="error">
                  {t('cancelledLine', { date: date(inv.cancelledAt) })}
                </Typography>
              )}
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('pos')}</TableCell>
                <TableCell>{tc('description')}</TableCell>
                <TableCell align="right">{t('quantity')}</TableCell>
                <TableCell align="right">{t('unitPriceShort')}</TableCell>
                <TableCell align="right">{tc('vat')}</TableCell>
                <TableCell align="right">{tc('net')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inv.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.position}</TableCell>
                  <TableCell>{l.description}</TableCell>
                  <TableCell align="right">
                    {l.quantity} {l.unit}
                  </TableCell>
                  <TableCell align="right">{eur(l.unitPrice)}</TableCell>
                  <TableCell align="right">
                    {l.taxTreatment === 'KLEINUNTERNEHMER_19' ? '§19' : pct(l.taxRate)}
                  </TableCell>
                  <TableCell align="right">{eur(l.netAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Stack alignItems="flex-end" sx={{ mt: 2 }} spacing={0.5}>
            <Typography>
              {t('netLine')} <strong>{eur(inv.subtotalNet)}</strong>
            </Typography>
            <Typography>
              {t('vatLine')} <strong>{eur(inv.taxTotal)}</strong>
            </Typography>
            <Typography variant="h6">{t('grossLine', { amount: eur(inv.grossTotal) })}</Typography>
            {!isDraft && (
              <Typography
                color={inv.outstandingAmount === '0.00' ? 'success.main' : 'warning.main'}
              >
                {t('paidOpen', { paid: eur(inv.paidAmount), open: eur(inv.outstandingAmount) })}
              </Typography>
            )}
          </Stack>
          {inv.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {inv.notes}
            </Typography>
          )}
        </CardContent>
      </Card>

      {!isDraft && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('payments')}
            </Typography>
            {(payments.data?.data ?? []).length === 0 ? (
              <Typography color="text.secondary">{t('noPayments')}</Typography>
            ) : (
              <Table size="small">
                <TableBody>
                  {payments.data!.data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{date(p.paymentDate)}</TableCell>
                      <TableCell>{te(p.paymentMethod)}</TableCell>
                      <TableCell>{p.reference ?? '—'}</TableCell>
                      <TableCell align="right">{eur(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} fullWidth maxWidth="sm">
        <form
          onSubmit={cancelForm.handleSubmit((v) =>
            cancel.mutate(v, { onSuccess: () => setCancelOpen(false) }),
          )}
        >
          <DialogTitle>{t('cancelTitle')}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="warning">{t('cancelHint')}</Alert>
              <FormTextField
                control={cancelForm.control}
                name="reason"
                label={t('reason')}
                multiline
                minRows={2}
                autoFocus
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelOpen(false)}>{tc('cancel')}</Button>
            <Button type="submit" color="error" variant="contained" disabled={cancel.isPending}>
              {t('cancel')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={payOpen} onClose={() => setPayOpen(false)} fullWidth maxWidth="sm">
        <form
          onSubmit={payForm.handleSubmit((v) =>
            pay.mutate(v, { onSuccess: () => setPayOpen(false) }),
          )}
        >
          <DialogTitle>{t('recordPayment')}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormTextField
                control={payForm.control}
                name="amount"
                label={t('amountOpen', { open: eur(inv.outstandingAmount) })}
                autoFocus
              />
              <FormTextField
                control={payForm.control}
                name="paymentDate"
                label={t('paymentDate')}
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Controller
                control={payForm.control}
                name="paymentMethod"
                render={({ field }) => (
                  <TextField select label={t('paymentMethod')} {...field}>
                    {PAYMENT_METHOD.map((m) => (
                      <MenuItem key={m} value={m}>
                        {te(m)}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <FormTextField
                control={payForm.control}
                name="reference"
                label={t('reference')}
                nullable
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPayOpen(false)}>{tc('cancel')}</Button>
            <Button type="submit" variant="contained" disabled={pay.isPending}>
              {t('record')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
