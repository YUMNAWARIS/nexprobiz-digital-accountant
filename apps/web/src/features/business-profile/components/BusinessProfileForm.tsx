'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Divider, Grid, MenuItem, Stack, Typography } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { z } from 'zod';
import { BusinessProfileInput, type BusinessProfileView } from '@fa/contracts';

type FormIn = z.input<typeof BusinessProfileInput>;
type FormOut = z.output<typeof BusinessProfileInput>;
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { useSaveBusinessProfile } from '../hooks';
import { TextField } from '@mui/material';

const EMPTY: FormIn = {
  legalName: '',
  businessName: null,
  businessType: 'FREIBERUFLER',
  address: { street: '', postalCode: '', city: '', country: 'DE' },
  email: null,
  phone: null,
  taxNumber: null,
  vatId: null,
  vatRegime: 'REGULAR',
  vatTaxationMethod: 'IST',
  chartOfAccounts: 'SKR03',
  invoicePrefix: '',
  paymentTermDays: 14,
  iban: null,
  bic: null,
  bankName: null,
};

function toInput(v: BusinessProfileView): FormIn {
  const { id: _i, version: _v, effectiveFrom: _f, effectiveTo: _t, createdAt: _c, ...rest } = v;
  return rest;
}

export function BusinessProfileForm({
  current,
  onSaved,
  submitLabel = 'Speichern',
}: {
  current: BusinessProfileView | null;
  onSaved?: (v: BusinessProfileView) => void;
  submitLabel?: string;
}) {
  const save = useSaveBusinessProfile();
  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(BusinessProfileInput),
    defaultValues: current ? toInput(current) : EMPTY,
  });
  const vatRegime = form.watch('vatRegime');
  const c = form.control;
  const Select = ({
    name,
    label,
    options,
  }: {
    name: 'businessType' | 'vatRegime' | 'vatTaxationMethod' | 'chartOfAccounts';
    label: string;
    options: Array<[string, string]>;
  }) => (
    <Controller
      control={c}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          select
          label={label}
          fullWidth
          {...field}
          value={field.value ?? ''}
          error={!!fieldState.error}
          helperText={fieldState.error?.message}
        >
          {options.map(([v, l]) => (
            <MenuItem key={v} value={v}>
              {l}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );

  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        save.mutate(
          { ...v, vatTaxationMethod: v.vatRegime === 'REGULAR' ? v.vatTaxationMethod : null },
          { onSuccess: onSaved },
        ),
      )}
      noValidate
    >
      <Stack spacing={3}>
        <ErrorAlert error={save.error} />
        <Typography variant="subtitle1" fontWeight={600}>
          Unternehmen
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="legalName" label="Name (rechtlich)" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField
              control={c}
              name="businessName"
              label="Geschäftsbezeichnung (optional)"
              nullable
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Select
              name="businessType"
              label="Art der Tätigkeit"
              options={[
                ['FREIBERUFLER', 'Freiberufler'],
                ['GEWERBETREIBENDER', 'Gewerbetreibender'],
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="email" label="E-Mail (auf Rechnung)" nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="phone" label="Telefon" nullable />
          </Grid>
        </Grid>
        <Divider />
        <Typography variant="subtitle1" fontWeight={600}>
          Adresse
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FormTextField control={c} name="address.street" label="Straße und Hausnummer" />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormTextField control={c} name="address.postalCode" label="PLZ" />
          </Grid>
          <Grid size={{ xs: 5 }}>
            <FormTextField control={c} name="address.city" label="Ort" />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <FormTextField control={c} name="address.country" label="Land" />
          </Grid>
        </Grid>
        <Divider />
        <Typography variant="subtitle1" fontWeight={600}>
          Steuern
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Select
              name="vatRegime"
              label="Umsatzsteuer"
              options={[
                ['REGULAR', 'Regelbesteuerung'],
                ['KLEINUNTERNEHMER', 'Kleinunternehmer (§19 UStG)'],
              ]}
            />
          </Grid>
          {vatRegime === 'REGULAR' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Select
                name="vatTaxationMethod"
                label="Versteuerung"
                options={[
                  ['IST', 'Ist-Versteuerung'],
                  ['SOLL', 'Soll-Versteuerung'],
                ]}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <Select
              name="chartOfAccounts"
              label="Kontenrahmen"
              options={[
                ['SKR03', 'SKR03'],
                ['SKR04', 'SKR04'],
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="taxNumber" label="Steuernummer" nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="vatId" label="USt-IdNr. (falls vorhanden)" nullable />
          </Grid>
        </Grid>
        <Divider />
        <Typography variant="subtitle1" fontWeight={600}>
          Rechnungen & Bank
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <FormTextField control={c} name="invoicePrefix" label="Rechnungsnummer-Präfix" />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Controller
              control={c}
              name="paymentTermDays"
              render={({ field, fieldState }) => (
                <TextField
                  type="number"
                  label="Zahlungsziel (Tage)"
                  fullWidth
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="bankName" label="Bank" nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <FormTextField control={c} name="iban" label="IBAN" nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormTextField control={c} name="bic" label="BIC" nullable />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={save.isPending}
          sx={{ alignSelf: 'flex-start' }}
        >
          {submitLabel}
        </Button>
      </Stack>
    </form>
  );
}
