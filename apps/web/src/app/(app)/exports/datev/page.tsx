'use client';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { CreateDatevExportRequest, SANDBOX } from '@fa/contracts';
import { DataTable } from '@/components/ui/DataTable';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusChip } from '@/components/ui/StatusChip';
import { datevApi } from '@/features/datev/api';
import { useCreateDatevExport, useExports } from '@/features/datev/hooks';
import { date, dateTime } from '@/lib/format';

const S = CreateDatevExportRequest;
type In = z.input<typeof S>;
type Out = z.output<typeof S>;
const year = new Date().getFullYear();

/** §32 — POST /exports/datev, then download via GET /exports/:id/download (stored artifact). */
export default function DatevExportPage() {
  const create = useCreateDatevExport();
  const exports = useExports();
  const [downloadError, setDownloadError] = useState<unknown>(null);
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(S),
    defaultValues: {
      periodStart: `${year}-01-01`,
      periodEnd: `${year}-12-31`,
      beraternummer: '',
      mandantennummer: '',
    },
  });
  return (
    <>
      <PageHeader title="DATEV-Export" />
      <Alert severity="warning" sx={{ mb: 2 }}>
        {SANDBOX.DATEV_DISCLAIMER}
      </Alert>
      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Buchungsstapel erzeugen
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enthält ausschließlich gebuchte Journaleinträge im Zeitraum (keine Entwürfe). Format
              EXTF 700, Kategorie 21, CP1252, Semikolon-getrennt.
            </Typography>
            <ErrorAlert error={create.error} />
            <form
              onSubmit={form.handleSubmit((v) =>
                create.mutate(v, {
                  onSuccess: (r) =>
                    datevApi
                      .download({ id: r.id, createdAt: new Date().toISOString() })
                      .catch(setDownloadError),
                }),
              )}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormTextField
                    control={form.control}
                    name="periodStart"
                    label="Von"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormTextField
                    control={form.control}
                    name="periodEnd"
                    label="Bis"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormTextField
                    control={form.control}
                    name="beraternummer"
                    label="Beraternummer"
                    helperText="4–7 Ziffern"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormTextField
                    control={form.control}
                    name="mandantennummer"
                    label="Mandantennummer"
                    helperText="1–5 Ziffern"
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={create.isPending}>
                {create.isPending ? 'Erzeuge…' : 'Export erzeugen & herunterladen'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Bisherige Exporte
            </Typography>
            <ErrorAlert error={downloadError} />
            <DataTable
              rows={exports.data?.data ?? []}
              loading={exports.isLoading}
              error={exports.error}
              getRowId={(r) => r.id}
              columns={[
                { key: 'created', header: 'Erzeugt', render: (r) => dateTime(r.createdAt) },
                {
                  key: 'period',
                  header: 'Zeitraum',
                  render: (r) => `${date(r.periodStart)} – ${date(r.periodEnd)}`,
                },
                { key: 'fmt', header: 'Format', render: (r) => `EXTF ${r.formatVersion ?? '—'}` },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => <StatusChip status={r.status} />,
                },
                {
                  key: 'dl',
                  header: '',
                  align: 'right',
                  render: (r) =>
                    r.status === 'COMPLETED' ? (
                      <IconButton
                        size="small"
                        aria-label="Herunterladen"
                        onClick={() => datevApi.download(r).catch(setDownloadError)}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    ) : null,
                },
              ]}
            />
          </CardContent>
        </Card>
      </Stack>
    </>
  );
}
