'use client';
import {
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { SANDBOX } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { CURRENT_YEAR, YearPicker } from '@/features/reports/components/YearPicker';
import { useEuer } from '@/features/reports/hooks';
import { eur } from '@/lib/format';

/** §30 EÜR preview — only POSTED entries; reversals net to zero. */
export default function EuerPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const q = useEuer(year);
  const d = q.data;
  return (
    <>
      <PageHeader
        title="Einnahmenüberschussrechnung (Vorschau)"
        actions={<YearPicker value={year} onChange={setYear} />}
      />
      <Alert severity="warning" sx={{ mb: 2 }}>
        {SANDBOX.REPORT_DISCLAIMER}
      </Alert>
      <ErrorAlert error={q.error} />
      {d && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600}>
              Betriebseinnahmen
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Dienstleistungen</TableCell>
                  <TableCell align="right">{eur(d.income.services)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Summe Einnahmen</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{eur(d.income.total)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }}>
              Betriebsausgaben
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Kategorie</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell align="right">Betrag</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {d.expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <em>Keine gebuchten Ausgaben.</em>
                    </TableCell>
                  </TableRow>
                )}
                {d.expenses.map((e) => (
                  <TableRow key={e.categoryCode}>
                    <TableCell>{e.name}</TableCell>
                    <TableCell>
                      <code>{e.categoryCode}</code>
                    </TableCell>
                    <TableCell align="right">{eur(e.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2}>
                    <strong>Summe Ausgaben</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{eur(d.totalExpenses)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Typography variant="h6" sx={{ mt: 3 }} textAlign="right">
              Gewinn: {eur(d.profit)}
            </Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
}
