'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Button,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { CreateInvoiceRequest, type InvoiceView, type TaxTreatment } from '@fa/contracts';

type FormIn = z.input<typeof CreateInvoiceRequest>;
type FormOut = z.output<typeof CreateInvoiceRequest>;
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { useBusinessProfile } from '@/features/business-profile/hooks';
import { useClients } from '@/features/clients/hooks';

const TREATMENTS: Array<[TaxTreatment, string]> = [
  ['STANDARD_19', '19 % USt'],
  ['REDUCED_7', '7 % USt'],
  ['KLEINUNTERNEHMER_19', 'Steuerfrei (§19 UStG)'],
];
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY_LINE = {
  description: '',
  quantity: '1',
  unit: 'Stunde',
  unitPrice: '',
  taxTreatment: 'STANDARD_19' as TaxTreatment,
};

/** Totals are NOT computed here (ARCH-004). The API returns them; the page displays them. */
export function InvoiceForm({
  current,
  onSubmit,
  pending,
  error,
}: {
  current?: InvoiceView;
  onSubmit: (v: FormOut) => void;
  pending: boolean;
  error: unknown;
}) {
  const clients = useClients({ status: 'ACTIVE', pageSize: 100 });
  const profile = useBusinessProfile();
  const klein = profile.data?.vatRegime === 'KLEINUNTERNEHMER';
  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(CreateInvoiceRequest),
    defaultValues: current
      ? {
          clientId: current.clientId,
          issueDate: current.issueDate ?? today(),
          serviceDate: current.serviceDate ?? undefined,
          dueDate: current.dueDate ?? undefined,
          notes: current.notes,
          lines: current.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unit: l.unit,
            unitPrice: l.unitPrice,
            taxTreatment: l.taxTreatment,
          })),
        }
      : {
          clientId: '',
          issueDate: today(),
          serviceDate: today(),
          notes: null,
          lines: [{ ...EMPTY_LINE, taxTreatment: klein ? 'KLEINUNTERNEHMER_19' : 'STANDARD_19' }],
        },
  });
  const lines = useFieldArray({ control: form.control, name: 'lines' });
  const c = form.control;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        <ErrorAlert error={error} />
        {klein && (
          <Alert severity="info">
            Kleinunternehmer (§19 UStG): Positionen werden ohne Umsatzsteuer berechnet.
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              control={c}
              name="clientId"
              render={({ field, fieldState }) => (
                <TextField
                  select
                  label="Kunde"
                  fullWidth
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                >
                  {(clients.data?.data ?? []).map((cl) => (
                    <MenuItem key={cl.id} value={cl.id}>
                      {cl.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <FormTextField
              control={c}
              name="issueDate"
              label="Rechnungsdatum"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <FormTextField
              control={c}
              name="serviceDate"
              label="Leistungsdatum"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 4, md: 2 }}>
            <FormTextField
              control={c}
              name="dueDate"
              label="Fällig am"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="leer = Zahlungsziel"
            />
          </Grid>
        </Grid>
        <Typography variant="subtitle1" fontWeight={600}>
          Positionen
        </Typography>
        {lines.fields.map((f, i) => (
          <Grid container spacing={1} key={f.id} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 5 }}>
              <FormTextField
                control={c}
                name={`lines.${i}.description`}
                label="Beschreibung"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 4, md: 1.5 }}>
              <FormTextField control={c} name={`lines.${i}.quantity`} label="Menge" size="small" />
            </Grid>
            <Grid size={{ xs: 4, md: 1.5 }}>
              <FormTextField control={c} name={`lines.${i}.unit`} label="Einheit" size="small" />
            </Grid>
            <Grid size={{ xs: 4, md: 1.5 }}>
              <FormTextField
                control={c}
                name={`lines.${i}.unitPrice`}
                label="Einzelpreis (netto)"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 10, md: 2 }}>
              <Controller
                control={c}
                name={`lines.${i}.taxTreatment`}
                render={({ field }) => (
                  <TextField
                    select
                    size="small"
                    label="Steuer"
                    fullWidth
                    {...field}
                    disabled={klein}
                  >
                    {TREATMENTS.map(([v, l]) => (
                      <MenuItem key={v} value={v}>
                        {l}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 2, md: 0.5 }}>
              <IconButton
                onClick={() => lines.remove(i)}
                disabled={lines.fields.length === 1}
                aria-label="Position entfernen"
              >
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={() =>
            lines.append({
              ...EMPTY_LINE,
              taxTreatment: klein ? 'KLEINUNTERNEHMER_19' : 'STANDARD_19',
            })
          }
          sx={{ alignSelf: 'flex-start' }}
        >
          Position hinzufügen
        </Button>
        <FormTextField
          control={c}
          name="notes"
          label="Hinweise (optional)"
          multiline
          minRows={2}
          nullable
        />
        <Typography variant="body2" color="text.secondary">
          Netto-, Steuer- und Bruttobeträge werden vom Server berechnet und nach dem Speichern
          angezeigt.
        </Typography>
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
