'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Grid, Stack } from '@mui/material';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { ConfirmReceiptRequest, type ReceiptView } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
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
  const form = useForm<
    z.input<typeof ConfirmReceiptRequest>,
    unknown,
    z.output<typeof ConfirmReceiptRequest>
  >({
    resolver: zodResolver(ConfirmReceiptRequest),
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
        {receipt.status === 'FAILED' && (
          <Alert severity="warning">
            Der Beleg konnte nicht automatisch gelesen werden. Bitte Werte manuell eintragen.
          </Alert>
        )}
        {receipt.ocrConfidence && (
          <Alert severity="info">
            OCR-Konfidenz: {(Number(receipt.ocrConfidence) * 100).toFixed(0)} % — bitte alle Werte
            prüfen.
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <FormTextField control={c} name="merchant" label="Händler" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormTextField control={c} name="receiptNumber" label="Belegnummer" nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormTextField
              control={c}
              name="receiptDate"
              label="Datum"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 4, md: 8 / 3 }}>
            <FormTextField control={c} name="netAmount" label="Netto" />
          </Grid>
          <Grid size={{ xs: 4, md: 8 / 3 }}>
            <FormTextField control={c} name="taxAmount" label="USt" />
          </Grid>
          <Grid size={{ xs: 4, md: 8 / 3 }}>
            <FormTextField control={c} name="grossAmount" label="Brutto (Gesamt)" />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          disabled={confirm.isPending}
          sx={{ alignSelf: 'flex-start' }}
        >
          Beleg bestätigen
        </Button>
      </Stack>
    </form>
  );
}
