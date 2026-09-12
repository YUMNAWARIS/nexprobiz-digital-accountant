/** ARCH-004: display-only formatting. Never compute here. */
import { formatEur, formatRatePercent } from '@fa/contracts';
export const eur = (m: string | null | undefined) => (m == null ? '—' : formatEur(m));
export const pct = (r: string | null | undefined) => (r == null ? '—' : formatRatePercent(r));
export const date = (d: string | null | undefined) =>
  d ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(d)) : '—';
export const dateTime = (d: string | null | undefined) =>
  d
    ? new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(d),
      )
    : '—';
