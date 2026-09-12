'use client';
import { Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { RegisterRequest } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { useZodResolver } from '@/i18n/useZodResolver';
import { useRegister } from '../hooks';

export function RegisterForm() {
  const router = useRouter();
  const t = useTranslations('auth');
  const register = useRegister();
  const form = useForm<z.input<typeof RegisterRequest>, unknown, z.output<typeof RegisterRequest>>({
    resolver: useZodResolver(RegisterRequest),
    defaultValues: { email: '', password: '' },
  });
  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        register.mutate(v, { onSuccess: () => router.replace('/onboarding') }),
      )}
      noValidate
    >
      <Stack spacing={2}>
        <ErrorAlert error={register.error} />
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
          label={t('passwordNew')}
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" variant="contained" size="large" disabled={register.isPending}>
          {t('register')}
        </Button>
        <Typography variant="body2" textAlign="center">
          {t('haveAccount')}{' '}
          <MuiLink component={Link} href="/login">
            {t('login')}
          </MuiLink>
        </Typography>
      </Stack>
    </form>
  );
}
