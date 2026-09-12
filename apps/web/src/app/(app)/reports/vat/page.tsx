'use client';
import {
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { SANDBOX } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { CURRENT_YEAR, YearPicker } from '@/features/reports/components/YearPicker';
import { useVat } from '@/features/reports/hooks';
import { eur } from '@/lib/format';

/** §31 VAT preview */
export default function VatPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const q = useVat(year);
  const d = q.data;
  return (
    <>
      <PageHeader
        title="Umsatzsteuer (Vorschau)"
        actions={<YearPicker value={year} onChange={setYear} />}
      />
      <Alert severity="warning" sx={{ mb: 2 }}>
        {SANDBOX.VAT_PREVIEW_DISCLAIMER} {SANDBOX.REPORT_DISCLAIMER}
      </Alert>
      <ErrorAlert error={q.error} />
      {d && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              {d.vatRegime === 'KLEINUNTERNEHMER'
                ? 'Kleinunternehmer (§19 UStG) — keine Umsatzsteuer'
                : 'Regelbesteuerung'}
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Umsatzsteuer (vereinnahmt)</TableCell>
                  <TableCell align="right">{eur(d.outputVat)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Vorsteuer</TableCell>
                  <TableCell align="right">{eur(d.inputVat)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Zahllast</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{eur(d.netVat)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
