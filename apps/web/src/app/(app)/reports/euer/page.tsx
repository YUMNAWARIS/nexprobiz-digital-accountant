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
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { CURRENT_YEAR, YearPicker } from '@/features/reports/components/YearPicker';
import { useCategoryName } from '@/features/expenses/hooks';
import { useEuer } from '@/features/reports/hooks';
import { useFormat } from '@/lib/format';

/** §30 EÜR preview — only POSTED entries; reversals net to zero. */
export default function EuerPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const q = useEuer(year);
  const d = q.data;
  const t = useTranslations('reports');
  const tc = useTranslations('common');
  const tsb = useTranslations('sandbox');
  const { eur } = useFormat();
  const categoryName = useCategoryName();
  return (
    <>
      <PageHeader title={t('euerTitle')} actions={<YearPicker value={year} onChange={setYear} />} />
      <Alert severity="warning" sx={{ mb: 2 }}>
        {tsb('reportDisclaimer')}
      </Alert>
      <ErrorAlert error={q.error} />
      {d && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600}>
              {t('income')}
            </Typography>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>{t('services')}</TableCell>
                  <TableCell align="right">{eur(d.income.services)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>{t('incomeTotal')}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{eur(d.income.total)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 3 }}>
              {t('expensesTitle')}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('category')}</TableCell>
                  <TableCell>{t('code')}</TableCell>
                  <TableCell align="right">{tc('amount')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {d.expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <em>{t('noPostedExpenses')}</em>
                    </TableCell>
                  </TableRow>
                )}
                {d.expenses.map((e) => (
                  <TableRow key={e.categoryCode}>
                    <TableCell>{categoryName(e.categoryCode, e.name)}</TableCell>
                    <TableCell>
                      <code>{e.categoryCode}</code>
                    </TableCell>
                    <TableCell align="right">{eur(e.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2}>
                    <strong>{t('expensesTotal')}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{eur(d.totalExpenses)}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Typography variant="h6" sx={{ mt: 3 }} textAlign="right">
              {t('profitLine', { amount: eur(d.profit) })}
            </Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
}
