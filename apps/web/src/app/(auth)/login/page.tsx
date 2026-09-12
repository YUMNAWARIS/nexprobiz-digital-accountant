'use client';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { LoginForm } from '@/features/auth/components/LoginForm';
export default function LoginPage() {
  const t = useTranslations('auth');
  return (
    <AuthCard title={t('login')}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
