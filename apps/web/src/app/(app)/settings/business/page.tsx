'use client';
import { Alert, Card, CardContent } from '@mui/material';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';
import { BusinessProfileForm } from '@/features/business-profile/components/BusinessProfileForm';
import { useBusinessProfile } from '@/features/business-profile/hooks';
import { useFormat } from '@/lib/format';

export default function BusinessSettingsPage() {
  const { data, isLoading } = useBusinessProfile();
  const t = useTranslations('profile');
  const { date } = useFormat();
  if (isLoading) return null;
  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={
          data
            ? t('versionInfo', { version: data.version, date: date(data.effectiveFrom) })
            : undefined
        }
      />
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('versioningHint')}
      </Alert>
      <Card>
        <CardContent>
          <BusinessProfileForm current={data ?? null} />
        </CardContent>
      </Card>
    </>
  );
}
