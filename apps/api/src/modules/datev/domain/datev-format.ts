/**
 * §33 — DATEV-Format "Buchungsstapel" (EXTF). The header/format version is represented through
 * DatevFormatDefinition. Sandbox implementation: correct structure and the mandatory columns;
 * NOT advertised as DATEV-certified (§33).
 */
import type { DatevFormatDefinition } from '@fa/contracts';

export const DATEV_FORMAT: DatevFormatDefinition & {
  formatName: string;
  dataCategoryName: string;
} = {
  formatVersion: '700', // Versionsnummer des Formats
  dataCategory: '21', // Buchungsstapel
  formatName: 'Buchungsstapel',
  dataCategoryName: 'Buchungsstapel',
};

/** Column headers (DATEV-Format v700, Buchungsstapel). We fill the §33 minimum and leave the rest empty. */
export const DATEV_COLUMNS = [
  'Umsatz (ohne Soll/Haben-Kz)',
  'Soll/Haben-Kennzeichen',
  'WKZ Umsatz',
  'Kurs',
  'Basis-Umsatz',
  'WKZ Basis-Umsatz',
  'Konto',
  'Gegenkonto (ohne BU-Schlüssel)',
  'BU-Schlüssel',
  'Belegdatum',
  'Belegfeld 1',
  'Belegfeld 2',
  'Skonto',
  'Buchungstext',
  'Postensperre',
  'Diverse Adressnummer',
  'Geschäftspartnerbank',
  'Sachverhalt',
  'Zinssperre',
  'Beleglink',
] as const;

export interface DatevBooking {
  umsatz: string; // "119,00" — always positive; direction via S/H
  sollHaben: 'S' | 'H';
  wkz: 'EUR';
  konto: string;
  gegenkonto: string;
  belegdatum: string; // TTMM
  belegfeld1: string; // invoice number / reference (≤ 36 chars)
  buchungstext: string; // ≤ 60 chars
}

export interface DatevHeaderInput {
  beraternummer: string;
  mandantennummer: string;
  wirtschaftsjahrBeginn: string; // YYYYMMDD
  periodStart: string; // YYYYMMDD
  periodEnd: string; // YYYYMMDD
  sachkontenlaenge: number; // 4 for SKR03/SKR04 sandbox
  createdAt: Date;
  bezeichnung: string;
}
