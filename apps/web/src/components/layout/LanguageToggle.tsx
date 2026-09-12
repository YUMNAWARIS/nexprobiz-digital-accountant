'use client';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALES } from '@/i18n/config';
import { setCookie } from '@/lib/cookies';

/** DE ⇄ EN. Persists in the `fa_locale` cookie; the server request config re-renders with it. */
export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations('nav');
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={locale}
      aria-label={t('language')}
      disabled={pending}
      onChange={(_, next: unknown) => {
        if (!isLocale(next) || next === locale) return;
        setCookie(LOCALE_COOKIE, next, LOCALE_COOKIE_MAX_AGE);
        start(() => router.refresh());
      }}
      sx={{ mr: 1 }}
    >
      {LOCALES.map((l) => (
        <ToggleButton key={l} value={l} sx={{ px: 1, py: 0.25, fontWeight: 600 }}>
          {l.toUpperCase()}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
