'use client';
import { Alert } from '@mui/material';
import { useTranslations } from 'next-intl';
/** §63 — displayed permanently in the sandbox header. */
export function SandboxBanner() {
  const t = useTranslations('sandbox');
  return (
    <Alert
      severity="warning"
      variant="filled"
      square
      sx={{ borderRadius: 0, justifyContent: 'center', py: 0 }}
    >
      <strong>{t('headerWarning')}</strong>
    </Alert>
  );
}
