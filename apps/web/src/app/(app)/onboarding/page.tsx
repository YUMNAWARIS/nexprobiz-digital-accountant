'use client';
import { Card, CardContent } from '@mui/material';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { BusinessProfileForm } from '@/features/business-profile/components/BusinessProfileForm';
import { useBusinessProfile } from '@/features/business-profile/hooks';

export default function OnboardingPage() {
  const router = useRouter();
  const { data, isLoading } = useBusinessProfile();
  if (isLoading) return null;
  return (
    <>
      <PageHeader
        title="Willkommen — Unternehmensprofil"
        subtitle="Diese Angaben erscheinen auf Ihren Rechnungen und bestimmen die steuerliche Behandlung."
      />
      <Card>
        <CardContent>
          <BusinessProfileForm
            current={data ?? null}
            submitLabel="Profil speichern und starten"
            onSaved={() => router.replace('/dashboard')}
          />
        </CardContent>
      </Card>
    </>
  );
}
