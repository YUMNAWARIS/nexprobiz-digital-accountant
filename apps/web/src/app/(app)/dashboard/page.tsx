'use client';
import { Alert, Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { useBusinessProfile } from '@/features/business-profile/hooks';
import { CURRENT_YEAR, YearPicker } from '@/features/reports/components/YearPicker';
import { useDashboard } from '@/features/reports/hooks';
import { useFormat } from '@/lib/format';

/** §51 — "Each number SHALL be clickable where an underlying list exists." */
function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <CardContent>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
    </CardContent>
  );
  return (
    <Card sx={{ height: '100%' }}>
      {href ? (
        <CardActionArea component={Link} href={href} sx={{ height: '100%' }}>
          {body}
        </CardActionArea>
      ) : (
        body
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const profile = useBusinessProfile();
  const q = useDashboard(year);
  const d = q.data;
  const t = useTranslations('dashboard');
  const tsb = useTranslations('sandbox');
  const { eur } = useFormat();
  return (
    <>
      <PageHeader title={t('title')} actions={<YearPicker value={year} onChange={setYear} />} />
      {profile.data === null && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={<Link href="/onboarding">{t('fillNow')}</Link>}
        >
          {t('profileMissing')}
        </Alert>
      )}
      <ErrorAlert error={q.error} />
      <Stack spacing={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stat label={t('revenue')} value={eur(d?.revenue)} href="/invoices?status=PAID" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stat label={t('expenses')} value={eur(d?.expenses)} href="/expenses?status=POSTED" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stat label={t('profit')} value={eur(d?.profit)} href="/reports/euer" />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stat
              label={t('outstanding')}
              value={eur(d?.outstandingInvoices)}
              href="/invoices?status=FINALIZED"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stat label={t('vatPreview')} value={eur(d?.vat.payable)} href="/reports/vat" />
          </Grid>
        </Grid>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {t('todo')}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stat
                  label={t('unreviewedBank')}
                  value={String(d?.workItems.unreviewedBankTransactions ?? '—')}
                  href="/banking?classification=UNREVIEWED"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stat
                  label={t('receiptsToReview')}
                  value={String(d?.workItems.receiptsNeedingReview ?? '—')}
                  href="/receipts?status=NEEDS_REVIEW"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stat
                  label={t('draftExpenses')}
                  value={String(d?.workItems.draftExpenses ?? '—')}
                  href="/expenses?status=DRAFT"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Typography variant="caption" color="text.secondary">
          {tsb('reportDisclaimer')}
        </Typography>
      </Stack>
    </>
  );
}
