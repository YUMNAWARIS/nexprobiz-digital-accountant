import { Alert } from '@mui/material';
import { ApiError } from '@/lib/api-client';
export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;
  const e = error as Error;
  const msg = e instanceof ApiError ? `${e.message} (${e.code})` : e.message;
  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {msg}
    </Alert>
  );
}
