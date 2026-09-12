'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale } from 'next-intl';
import type { z } from 'zod';
import type { Locale } from './config';
import { zodErrorMap } from './validation';

/** zodResolver with the locale's error map (default zod messages). */
export function useZodResolver<S extends z.ZodTypeAny>(schema: S) {
  const locale = useLocale() as Locale;
  return zodResolver(schema, { errorMap: zodErrorMap(locale), path: [], async: true });
}
