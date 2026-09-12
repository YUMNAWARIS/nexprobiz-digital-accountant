import type { ZodErrorMap } from 'zod';
import { z } from 'zod';
import type { Locale } from './config';

/**
 * Zod default messages (code-based) per locale. Custom messages defined in @fa/contracts are
 * English identifiers and are translated at display time via `translateValidation`.
 */
export function zodErrorMap(locale: Locale): ZodErrorMap {
  if (locale === 'en') return z.defaultErrorMap;
  return (issue, ctx) => {
    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        return { message: issue.received === 'undefined' ? 'Pflichtfeld' : 'Ungültiger Wert' };
      case z.ZodIssueCode.too_small:
        if (issue.type === 'string')
          return {
            message: issue.minimum === 1 ? 'Pflichtfeld' : `Mindestens ${issue.minimum} Zeichen`,
          };
        if (issue.type === 'array') return { message: `Mindestens ${issue.minimum} Einträge` };
        return { message: `Mindestens ${issue.minimum}` };
      case z.ZodIssueCode.too_big:
        if (issue.type === 'string') return { message: `Höchstens ${issue.maximum} Zeichen` };
        return { message: `Höchstens ${issue.maximum}` };
      case z.ZodIssueCode.invalid_string:
        if (issue.validation === 'email') return { message: 'Ungültige E-Mail-Adresse' };
        if (issue.validation === 'uuid') return { message: 'Ungültige Auswahl' };
        return { message: 'Ungültiges Format' };
      case z.ZodIssueCode.invalid_enum_value:
        return { message: 'Ungültige Auswahl' };
      default:
        return { message: ctx.defaultError };
    }
  };
}

/** Custom messages from @fa/contracts schemas (English) → German. Unknown messages pass through. */
const CONTRACT_MESSAGES_DE: Record<string, string> = {
  Required: 'Pflichtfeld',
  'Expected YYYY-MM-DD': 'Format JJJJ-MM-TT erwartet',
  'Expected a valid calendar date': 'Ungültiges Datum',
  'Invalid IBAN': 'Ungültige IBAN',
  'Invalid BIC': 'Ungültige BIC',
  'Amount must be greater than zero': 'Betrag muss größer als 0 sein',
  'Amount must not be negative': 'Betrag darf nicht negativ sein',
  'Quantity must be greater than zero': 'Menge muss größer als 0 sein',
  'Percentage must be between 0 and 100': 'Prozentsatz muss zwischen 0 und 100 liegen',
  'Beraternummer must be 4–7 digits': 'Beraternummer muss 4–7 Ziffern haben',
  'Mandantennummer must be 1–5 digits': 'Mandantennummer muss 1–5 Ziffern haben',
  'periodEnd must not be before periodStart': 'Ende darf nicht vor Beginn liegen',
  'unitPrice must be a decimal string with up to 4 decimal places':
    'Einzelpreis: Dezimalzahl mit bis zu 4 Nachkommastellen',
  'Ist-/Soll-Versteuerung is required for regular VAT.':
    'Ist-/Soll-Versteuerung ist bei Regelbesteuerung erforderlich.',
};

export function translateValidation(locale: Locale, message: string | undefined) {
  if (!message) return message;
  if (locale === 'en') return message;
  if (CONTRACT_MESSAGES_DE[message]) return CONTRACT_MESSAGES_DE[message];
  const m = message.match(/^(\w[\w ]*) must be a decimal string like "([^"]+)"$/);
  if (m) return `${m[1]}: Dezimalzahl wie "${m[2]}" erwartet`;
  const d = message.match(/^(\w[\w ]*) may have at most (\d+) decimal places$/);
  if (d) return `${d[1]}: höchstens ${d[2]} Nachkommastellen`;
  return message;
}
