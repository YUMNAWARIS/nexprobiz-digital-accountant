import type { Metadata } from 'next';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Freelancer Accounting — Sandbox',
  description: 'Sandbox — For testing only. Do not use for official bookkeeping or tax filing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
