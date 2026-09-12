'use client';
/** ARCH-004: display-only formatting. Never compute here. */
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { formatEur, formatRatePercent } from '@fa/contracts';
import { INTL_LOCALE, type Locale } from '@/i18n/config';

export function createFormatters(locale: Locale) {
  const tag = INTL_LOCALE[locale];
  const d = new Intl.DateTimeFormat(tag, { dateStyle: 'medium' });
  const dt = new Intl.DateTimeFormat(tag, { dateStyle: 'medium', timeStyle: 'short' });
  return {
    eur: (m: string | null | undefined) => (m == null ? '—' : formatEur(m, tag)),
    pct: (r: string | null | undefined) => (r == null ? '—' : formatRatePercent(r, tag)),
    date: (v: string | null | undefined) => (v ? d.format(new Date(v)) : '—'),
    dateTime: (v: string | null | undefined) => (v ? dt.format(new Date(v)) : '—'),
  };
}
export type Formatters = ReturnType<typeof createFormatters>;

/** Locale-aware `eur / pct / date / dateTime`. Destructure at component top level. */
export function useFormat(): Formatters {
  const locale = useLocale() as Locale;
  return useMemo(() => createFormatters(locale), [locale]);
}
