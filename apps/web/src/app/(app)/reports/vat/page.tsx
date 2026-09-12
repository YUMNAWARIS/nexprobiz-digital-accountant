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
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { CURRENT_YEAR, YearPicker } from '@/features/reports/components/YearPicker';
import { useVat } from '@/features/reports/hooks';
import { useFormat } from '@/lib/format';

/** §31 VAT preview */
export default function VatPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const q = useVat(year);
  const d = q.data;
  const t = useTranslations('reports');
  const tsb = useTranslations('sandbox');
  const { eur } = useFormat();
  return (
    <>
      <PageHeader title={t('vatTitle')} actions={<YearPicker value={year} onChange={setYear} />} />
      <Alert severity="warning" sx={{ mb: 2 }}>
        {tsb('vatPreviewDisclaimer')} {tsb('reportDisclaimer')}
      </Alert>
      <ErrorAlert error={q.error} />
      {d && (
        <Card>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">
              {d.vatRegime === 'KLEINUNTERNEHMER' ? t('kleinNoVat') : t('regular')}
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>{t('outputVat')}</TableCell>
                  <TableCell align="right">{eur(d.outputVat)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t('inputVat')}</TableCell>
                  <TableCell align="right">{eur(d.inputVat)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>{t('netVat')}</strong>
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
