'use client';
import { Alert } from '@mui/material';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/api-client';

/** §18 errors: localized by `code` when a translation exists, else the server message. */
export function useErrorMessage() {
  const t = useTranslations('errors');
  return (error: unknown): string => {
    if (error instanceof ApiError) {
      const detail = error.body.details?.map((d) => `${d.field}: ${d.message}`).join(', ');
      const base = t.has(error.code) ? t(error.code) : error.message;
      return `${base}${detail ? ` — ${detail}` : ''} (${error.code})`;
    }
    return String((error as Error)?.message ?? error);
  };
}

export function ErrorAlert({ error }: { error: unknown }) {
  const msg = useErrorMessage();
  if (!error) return null;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {msg(error)}
    </Alert>
  );
}
