'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Link as MuiLink, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { RegisterRequest } from '@fa/contracts';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { FormTextField } from '@/components/ui/FormTextField';
import { useRegister } from '../hooks';

export function RegisterForm() {
  const router = useRouter();
  const register = useRegister();
  const form = useForm<z.input<typeof RegisterRequest>, unknown, z.output<typeof RegisterRequest>>({
    resolver: zodResolver(RegisterRequest),
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
          label="E-Mail"
          type="email"
          autoComplete="email"
          autoFocus
        />
        <FormTextField
          control={form.control}
          name="password"
          label="Passwort (min. 8 Zeichen)"
          type="password"
          autoComplete="new-password"
        />
        <Button type="submit" variant="contained" size="large" disabled={register.isPending}>
          Konto erstellen
        </Button>
        <Typography variant="body2" textAlign="center">
          Bereits registriert?{' '}
          <MuiLink component={Link} href="/login">
            Anmelden
          </MuiLink>
        </Typography>
      </Stack>
    </form>
  );
}
