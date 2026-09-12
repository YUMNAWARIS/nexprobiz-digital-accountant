'use client';
import { Alert, Button, Grid, Stack } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ConfirmReceiptRequest, type ReceiptView } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { useZodResolver } from '@/i18n/useZodResolver';
import { useConfirmReceipt } from '../hooks';

/** Story 8.3 — user corrects OCR fields; confirm → CONFIRMED. Original OCR result stays in ocr_runs. */
export function ReceiptReviewForm({
  receipt,
  onConfirmed,
}: {
  receipt: ReceiptView;
  onConfirmed?: (r: ReceiptView) => void;
}) {
  const confirm = useConfirmReceipt(receipt.id);
  const t = useTranslations('receipts');
  const tc = useTranslations('common');
  const form = useForm<
    z.input<typeof ConfirmReceiptRequest>,
    unknown,
    z.output<typeof ConfirmReceiptRequest>
  >({
    resolver: useZodResolver(ConfirmReceiptRequest),
    defaultValues: {
      merchant: receipt.merchant ?? '',
      receiptNumber: receipt.receiptNumber,
      receiptDate: receipt.receiptDate ?? '',
      netAmount: receipt.netAmount ?? '',
      taxAmount: receipt.taxAmount ?? '0.00',
      grossAmount: receipt.grossAmount ?? '',
    },
  });
  const c = form.control;
  return (
    <form
      onSubmit={form.handleSubmit((v) => confirm.mutate(v, { onSuccess: onConfirmed }))}
      noValidate
    >
      <Stack spacing={2}>
        <ErrorAlert error={confirm.error} />
        {receipt.status === 'FAILED' && <Alert severity="warning">{t('ocrFailed')}</Alert>}
        {receipt.ocrConfidence && (
          <Alert severity="info">
            {t('ocrConfidence', { pct: (Number(receipt.ocrConfidence) * 100).toFixed(0) })}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <FormTextField control={c} name="merchant" label={t('merchant')} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormTextField control={c} name="receiptNumber" label={t('receiptNumber')} nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormTextField
              control={c}
              name="receiptDate"
              label={tc('date')}
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 4, md: 8 / 3 }}>
            <FormTextField control={c} name="netAmount" label={tc('net')} />
          </Grid>
          <Grid size={{ xs: 4, md: 8 / 3 }}>
            <FormTextField control={c} name="taxAmount" label={tc('vat')} />
          </Grid>
          <Grid size={{ xs: 4, md: 8 / 3 }}>
            <FormTextField control={c} name="grossAmount" label={t('grossTotal')} />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          disabled={confirm.isPending}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('confirm')}
        </Button>
      </Stack>
    </form>
  );
}
