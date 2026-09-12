import { AppShell } from '@/components/layout/AppNav';
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
