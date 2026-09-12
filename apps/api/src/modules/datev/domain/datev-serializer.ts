/**
 * DatevSerializer — bookings → EXTF CSV text (pure). Semicolon-separated, text in quotes,
 * CRLF, header record + column header + rows. Encoding to CP1252 happens in the service.
 */
import {
  DATEV_COLUMNS,
  DATEV_FORMAT,
  type DatevBooking,
  type DatevHeaderInput,
} from './datev-format';

const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
const ts = (d: Date) => d.toISOString().replace(/[-:T]/g, '').slice(0, 17); // YYYYMMDDHHMMSSmmm

export function serializeHeaderRecord(h: DatevHeaderInput): string {
  // Positions per DATEV-Format v700 header: EXTF;Version;Kategorie;Formatname;Formatversion;Erzeugt am;Importiert;Herkunft;Exportiert von;Importiert von;Berater;Mandant;WJ-Beginn;Sachkontenlänge;Datum von;Datum bis;Bezeichnung;Diktatkürzel;Buchungstyp;Rechnungslegungszweck;Festschreibung;WKZ
  return [
    q('EXTF'),
    DATEV_FORMAT.formatVersion,
    DATEV_FORMAT.dataCategory,
    q(DATEV_FORMAT.formatName),
    '7',
    ts(h.createdAt),
    '',
    q('FA'),
    q('SANDBOX'),
    '',
    h.beraternummer,
    h.mandantennummer,
    h.wirtschaftsjahrBeginn,
    String(h.sachkontenlaenge),
    h.periodStart,
    h.periodEnd,
    q(h.bezeichnung),
    q(''),
    '1',
    '0',
    '0',
    q('EUR'),
  ].join(';');
}

export function serializeBookings(h: DatevHeaderInput, rows: readonly DatevBooking[]): string {
  const lines = [serializeHeaderRecord(h), DATEV_COLUMNS.map(q).join(';')];
  for (const r of rows) {
    const cells: string[] = new Array<string>(DATEV_COLUMNS.length).fill('');
    cells[0] = r.umsatz;
    cells[1] = q(r.sollHaben);
    cells[2] = q(r.wkz);
    cells[6] = r.konto;
    cells[7] = r.gegenkonto;
    cells[9] = r.belegdatum;
    cells[10] = q(r.belegfeld1);
    cells[13] = q(r.buchungstext);
    lines.push(cells.join(';'));
  }
  return lines.join('\r\n') + '\r\n';
}

/** Minimal parser used by tests and the §33 acceptance check ("CSV SHALL parse correctly"). */
export function parseDatevCsv(text: string): {
  header: string[];
  columns: string[];
  rows: string[][];
} {
  const split = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') inQ = false;
        else cur += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ';') {
        out.push(cur);
        cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  return {
    header: split(lines[0] ?? ''),
    columns: split(lines[1] ?? ''),
    rows: lines.slice(2).map(split),
  };
}
