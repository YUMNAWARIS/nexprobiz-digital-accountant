'use client';
import { Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { LoginRequest } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { useZodResolver } from '@/i18n/useZodResolver';
import { useLogin } from '../hooks';

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations('auth');
  const from = useSearchParams().get('from');
  const login = useLogin();
  const form = useForm<z.input<typeof LoginRequest>, unknown, z.output<typeof LoginRequest>>({
    resolver: useZodResolver(LoginRequest),
    defaultValues: { email: '', password: '' },
  });
  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        login.mutate(v, {
          onSuccess: () => router.replace(from && from.startsWith('/') ? from : '/dashboard'),
        }),
      )}
      noValidate
    >
      <Stack spacing={2}>
        <ErrorAlert error={login.error} />
        <FormTextField
          control={form.control}
          name="email"
          label={t('email')}
          type="email"
          autoComplete="email"
          autoFocus
        />
        <FormTextField
          control={form.control}
          name="password"
          label={t('password')}
          type="password"
          autoComplete="current-password"
        />
        <Button type="submit" variant="contained" size="large" disabled={login.isPending}>
          {t('login')}
        </Button>
        <Typography variant="body2" textAlign="center">
          {t('noAccount')}{' '}
          <MuiLink component={Link} href="/register">
            {t('register')}
          </MuiLink>
        </Typography>
      </Stack>
    </form>
  );
}
