'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Grid, Stack, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { CreateClientRequest, type ClientView } from '@fa/contracts';

type FormIn = z.input<typeof CreateClientRequest>;
type FormOut = z.output<typeof CreateClientRequest>;
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';

const EMPTY: FormIn = {
  name: '',
  contactName: null,
  email: null,
  street: null,
  postalCode: null,
  city: null,
  country: 'DE',
  vatId: null,
  paymentTermDays: null,
};

export function ClientForm({
  current,
  onSubmit,
  pending,
  error,
}: {
  current?: ClientView;
  onSubmit: (v: FormOut) => void;
  pending: boolean;
  error: unknown;
}) {
  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(CreateClientRequest),
    defaultValues: current
      ? {
          name: current.name,
          contactName: current.contactName,
          email: current.email,
          street: current.street,
          postalCode: current.postalCode,
          city: current.city,
          country: current.country,
          vatId: current.vatId,
          paymentTermDays: current.paymentTermDays,
        }
      : EMPTY,
  });
  const c = form.control;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <ErrorAlert error={error} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="name" label="Firma / Name" autoFocus />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="contactName" label="Ansprechpartner" nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="email" label="E-Mail" nullable />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormTextField control={c} name="vatId" label="USt-IdNr." nullable />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormTextField control={c} name="street" label="Straße" nullable />
          </Grid>
          <Grid size={{ xs: 4 }}>
            <FormTextField control={c} name="postalCode" label="PLZ" nullable />
          </Grid>
          <Grid size={{ xs: 5 }}>
            <FormTextField control={c} name="city" label="Ort" nullable />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <FormTextField control={c} name="country" label="Land" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Controller
              control={c}
              name="paymentTermDays"
              render={({ field, fieldState }) => (
                <TextField
                  type="number"
                  label="Zahlungsziel (Tage, optional)"
                  fullWidth
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? null : Number(e.target.value))
                  }
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          variant="contained"
          disabled={pending}
          sx={{ alignSelf: 'flex-start' }}
        >
          Speichern
        </Button>
      </Stack>
    </form>
  );
}
