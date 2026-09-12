import { AuthCard } from '@/features/auth/components/AuthCard';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
export default function RegisterPage() {
  return (
    <AuthCard title="Registrieren">
      <RegisterForm />
    </AuthCard>
  );
}
