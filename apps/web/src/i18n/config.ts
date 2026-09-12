export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';
/** Cookie read by the server request config (no URL prefix — §50 routes stay unchanged). */
export const LOCALE_COOKIE = 'fa_locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const isLocale = (v: unknown): v is Locale => LOCALES.includes(v as Locale);
/** Intl locale tags used for dates/money display per UI language. */
export const INTL_LOCALE: Record<Locale, string> = { de: 'de-DE', en: 'en-GB' };
