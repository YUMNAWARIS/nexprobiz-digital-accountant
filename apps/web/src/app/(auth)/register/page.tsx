'use client';
import { useTranslations } from 'next-intl';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
export default function RegisterPage() {
  const t = useTranslations('auth');
  return (
    <AuthCard title={t('register')}>
      <RegisterForm />
    </AuthCard>
  );
}
