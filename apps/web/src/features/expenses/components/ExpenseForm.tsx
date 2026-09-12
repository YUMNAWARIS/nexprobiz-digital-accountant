'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  CreateExpenseRequest,
  type ExpenseView,
  type ReceiptView,
  type TaxTreatment,
} from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { useBusinessProfile } from '@/features/business-profile/hooks';
import { useExpenseCategories } from '../hooks';

type FormIn = z.input<typeof CreateExpenseRequest>;
type FormOut = z.output<typeof CreateExpenseRequest>;
const TREATMENTS: Array<[TaxTreatment, string]> = [
  ['STANDARD_19', '19 % Vorsteuer'],
  ['REDUCED_7', '7 % Vorsteuer'],
  ['KLEINUNTERNEHMER_19', 'Keine Vorsteuer (§19)'],
];

/** Story 9.1 — a confirmed receipt prefills the draft. Amounts are declared, not computed here. */
export function ExpenseForm({
  current,
  receipt,
  onSubmit,
  pending,
  error,
}: {
  current?: ExpenseView;
  receipt?: ReceiptView | null;
  onSubmit: (v: FormOut) => void;
  pending: boolean;
  error: unknown;
}) {
  const cats = useExpenseCategories();
  const profile = useBusinessProfile();
  const klein = profile.data?.vatRegime === 'KLEINUNTERNEHMER';
  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(CreateExpenseRequest),
    defaultValues: current
      ? {
          receiptId: current.receiptId,
          merchant: current.merchant,
          description: current.description,
          expenseDate: current.expenseDate,
          paymentDate: current.paymentDate,
          categoryId: current.categoryId,
          taxTreatment: current.taxTreatment,
          netAmount: current.netAmount,
          taxAmount: current.taxAmount,
          grossAmount: current.grossAmount,
          businessPercentage: current.businessPercentage,
        }
      : {
          receiptId: receipt?.id ?? null,
          merchant: receipt?.merchant ?? '',
          description: null,
          expenseDate: receipt?.receiptDate ?? new Date().toISOString().slice(0, 10),
          paymentDate: receipt?.receiptDate ?? null,
          categoryId: '',
          taxTreatment: klein ? 'KLEINUNTERNEHMER_19' : 'STANDARD_19',
          netAmount: receipt?.netAmount ?? '',
          taxAmount: receipt?.taxAmount ?? '0.00',
          grossAmount: receipt?.grossAmount ?? '',
          businessPercentage: '100.00',
        },
  });
  const c = form.control;
  const expenseCats = (cats.data?.data ?? []).filter((x) => x.type === 'EXPENSE' && x.active);
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <ErrorAlert error={error} />
        {receipt && (
          <Alert severity="info">
            Vorbelegt aus Beleg „{receipt.merchant}“ vom {receipt.receiptDate}.
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="merchant" label="Händler / Lieferant" autoFocus />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={c}
              name="categoryId"
              render={({ field, fieldState }) => (
                <TextField
                  select
                  label="Kategorie"
                  fullWidth
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {expenseCats.map((x) => (
                    <MenuItem key={x.id} value={x.id}>
                      {x.nameDe}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormTextField control={c} name="description" label="Beschreibung" nullable />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <FormTextField
              control={c}
              name="expenseDate"
              label="Belegdatum"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <FormTextField
              control={c}
              name="paymentDate"
              label="Zahlungsdatum"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              nullable
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Controller
              control={c}
              name="taxTreatment"
              render={({ field }) => (
                <TextField select label="Steuer" fullWidth {...field}>
                  {TREATMENTS.map(([v, l]) => (
                    <MenuItem key={v} value={v}>
                      {l}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <FormTextField control={c} name="businessPercentage" label="Geschäftlicher Anteil %" />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormTextField control={c} name="netAmount" label="Netto" />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormTextField control={c} name="taxAmount" label="USt" />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormTextField
              control={c}
              name="grossAmount"
              label="Brutto"
              helperText="Brutto = Netto + USt"
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          disabled={pending}
          sx={{ alignSelf: 'flex-start' }}
        >
          Entwurf speichern
        </Button>
      </Stack>
    </form>
  );
}
