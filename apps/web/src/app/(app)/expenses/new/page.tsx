'use client';
import { Card, CardContent } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExpenseForm } from '@/features/expenses/components/ExpenseForm';
import { useCreateExpense } from '@/features/expenses/hooks';
import { useReceipt } from '@/features/receipts/hooks';

function NewExpenseInner() {
  const router = useRouter();
  const receiptId = useSearchParams().get('receiptId') ?? '';
  const receipt = useReceipt(receiptId);
  const create = useCreateExpense();
  const t = useTranslations('expenses');
  if (receiptId && receipt.isLoading) return null;
  return (
    <>
      <PageHeader title={t('new')} subtitle={t('newSubtitle')} />
      <Card>
        <CardContent>
          <ExpenseForm
            receipt={receipt.data ?? null}
            onSubmit={(v) =>
              create.mutate(v, { onSuccess: (e) => router.replace(`/expenses/${e.id}`) })
            }
            pending={create.isPending}
            error={create.error}
          />
        </CardContent>
      </Card>
    </>
  );
}
export default function NewExpensePage() {
  return (
    <Suspense>
      <NewExpenseInner />
    </Suspense>
  );
}
