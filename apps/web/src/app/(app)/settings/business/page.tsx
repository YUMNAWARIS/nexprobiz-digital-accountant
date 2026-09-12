'use client';
import { Alert, Card, CardContent } from '@mui/material';
import { PageHeader } from '@/components/ui/PageHeader';
import { BusinessProfileForm } from '@/features/business-profile/components/BusinessProfileForm';
import { useBusinessProfile } from '@/features/business-profile/hooks';

export default function BusinessSettingsPage() {
  const { data, isLoading } = useBusinessProfile();
  if (isLoading) return null;
  return (
    <>
      <PageHeader
        title="Unternehmensprofil"
        subtitle={
          data
            ? `Version ${data.version} · gültig seit ${new Date(data.effectiveFrom).toLocaleDateString('de-DE')}`
            : undefined
        }
      />
      <Alert severity="info" sx={{ mb: 2 }}>
        Jede Änderung erzeugt eine neue Version. Bereits finalisierte Rechnungen behalten die damals
        gültige Version.
      </Alert>
      <Card>
        <CardContent>
          <BusinessProfileForm current={data ?? null} />
        </CardContent>
      </Card>
    </>
  );
}
