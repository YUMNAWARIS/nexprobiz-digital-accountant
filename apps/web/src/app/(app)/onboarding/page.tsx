'use client';
import { Card, CardContent } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { BusinessProfileForm } from '@/features/business-profile/components/BusinessProfileForm';
import { useBusinessProfile } from '@/features/business-profile/hooks';

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations('profile');
  const { data, isLoading } = useBusinessProfile();
  if (isLoading) return null;
  return (
    <>
      <PageHeader title={t('onboardingTitle')} subtitle={t('onboardingSubtitle')} />
      <Card>
        <CardContent>
          <BusinessProfileForm
            current={data ?? null}
            submitLabel={t('onboardingSubmit')}
            onSaved={() => router.replace('/dashboard')}
          />
        </CardContent>
      </Card>
    </>
  );
}
