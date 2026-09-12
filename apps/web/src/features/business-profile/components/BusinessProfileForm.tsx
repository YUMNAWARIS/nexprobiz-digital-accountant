'use client';
import { Button, Divider, Grid, MenuItem, Stack, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import type { z } from 'zod';
import { BusinessProfileInput, type BusinessProfileView } from '@fa/contracts';

type FormIn = z.input<typeof BusinessProfileInput>;
type FormOut = z.output<typeof BusinessProfileInput>;
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { useZodResolver } from '@/i18n/useZodResolver';
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
  submitLabel,
}: {
  current: BusinessProfileView | null;
  onSaved?: (v: BusinessProfileView) => void;
  submitLabel?: string;
}) {
  const save = useSaveBusinessProfile();
  const t = useTranslations('profile');
  const te = useTranslations('enums');
  const tc = useTranslations('common');
  const form = useForm<FormIn, unknown, FormOut>({
    resolver: useZodResolver(BusinessProfileInput),
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
          {t('sectionBusiness')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="legalName" label={t('legalName')} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="businessName" label={t('businessName')} nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Select
              name="businessType"
              label={t('businessType')}
              options={[
                ['FREIBERUFLER', te('FREIBERUFLER')],
                ['GEWERBETREIBENDER', te('GEWERBETREIBENDER')],
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="email" label={t('emailOnInvoice')} nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="phone" label={t('phone')} nullable />
          </Grid>
        </Grid>
        <Divider />
        <Typography variant="subtitle1" fontWeight={600}>
          {t('sectionAddress')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <FormTextField control={c} name="address.street" label={t('street')} />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormTextField control={c} name="address.postalCode" label={t('postalCode')} />
          </Grid>
          <Grid size={{ xs: 5 }}>
            <FormTextField control={c} name="address.city" label={t('city')} />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <FormTextField control={c} name="address.country" label={t('country')} />
          </Grid>
        </Grid>
        <Divider />
        <Typography variant="subtitle1" fontWeight={600}>
          {t('sectionTax')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Select
              name="vatRegime"
              label={t('vatRegime')}
              options={[
                ['REGULAR', te('REGULAR')],
                ['KLEINUNTERNEHMER', te('KLEINUNTERNEHMER')],
              ]}
            />
          </Grid>
          {vatRegime === 'REGULAR' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Select
                name="vatTaxationMethod"
                label={t('vatTaxationMethod')}
                options={[
                  ['IST', te('IST')],
                  ['SOLL', te('SOLL')],
                ]}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <Select
              name="chartOfAccounts"
              label={t('chartOfAccounts')}
              options={[
                ['SKR03', 'SKR03'],
                ['SKR04', 'SKR04'],
              ]}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="taxNumber" label={t('taxNumber')} nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="vatId" label={t('vatId')} nullable />
          </Grid>
        </Grid>
        <Divider />
        <Typography variant="subtitle1" fontWeight={600}>
          {t('sectionInvoicesBank')}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <FormTextField control={c} name="invoicePrefix" label={t('invoicePrefix')} />
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Controller
              control={c}
              name="paymentTermDays"
              render={({ field, fieldState }) => (
                <TextField
                  type="number"
                  label={t('paymentTermDays')}
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
            <FormTextField control={c} name="bankName" label={t('bankName')} nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <FormTextField control={c} name="iban" label={t('iban')} nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormTextField control={c} name="bic" label={t('bic')} nullable />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={save.isPending}
          sx={{ alignSelf: 'flex-start' }}
        >
          {submitLabel ?? tc('save')}
        </Button>
      </Stack>
    </form>
  );
}
