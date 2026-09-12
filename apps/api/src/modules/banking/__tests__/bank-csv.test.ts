import { BANK_CSV_TEMPLATE } from '@fa/contracts';
import { externalKey, parseBankCsv, splitCsvLine } from '../domain/bank-csv';

describe('§26 bank CSV parser', () => {
  it('parses the spec template', () => {
    const p = parseBankCsv(BANK_CSV_TEMPLATE);
    expect(p.errors).toEqual([]);
    expect(p.rowCount).toBe(2);
    expect(p.rows.map((r) => [r.line, r.row.amount, r.row.counterparty])).toEqual([
      [2, '-59.50', 'Adobe'],
      [3, '952.00', 'Example GmbH'],
    ]);
  });
  it('reports malformed rows with their line number (Story 10.1)', () => {
    const p = parseBankCsv(
      'booking_date,value_date,description,counterparty,amount,currency\n2026-13-45,,x,y,1.00,EUR\n2026-09-01,,x,y,abc,EUR\n2026-09-01,,ok,y,1.00,EUR\n2026-09-01,,x,y,1.00,USD',
    );
    expect(p.rows.map((r) => r.line)).toEqual([4]);
    expect(p.errors.map((e) => e.line)).toEqual([2, 3, 5]);
    expect(p.errors[0]!.message).toMatch(/booking_date/);
    expect(p.errors[1]!.message).toMatch(/amount/);
  });
  it('rejects a wrong header', () => {
    const p = parseBankCsv('date,amount\n2026-01-01,1');
    expect(p.errors).toEqual([
      { line: 1, message: expect.stringContaining('Header must be exactly') },
    ]);
  });
  it('handles quoted commas and BOM', () => {
    const p = parseBankCsv(
      '﻿booking_date,value_date,description,counterparty,amount,currency\n2026-09-01,2026-09-01,"Miete, Büro","Vermieter ""GmbH""",-500.00,EUR',
    );
    expect(p.rows[0]!.row).toMatchObject({
      description: 'Miete, Büro',
      counterparty: 'Vermieter "GmbH"',
      amount: '-500.00',
    });
    expect(splitCsvLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd']);
  });
  it('external key is deterministic and sensitive to every field', () => {
    const base = {
      booking_date: '2026-09-01',
      value_date: null,
      description: 'x',
      counterparty: 'y',
      amount: '1.00' as never,
      currency: 'EUR' as const,
    };
    expect(externalKey(base)).toBe(externalKey({ ...base }));
    expect(externalKey(base)).not.toBe(externalKey({ ...base, amount: '1.01' as never }));
    expect(externalKey(base)).not.toBe(externalKey({ ...base, counterparty: null }));
    expect(externalKey(base)).toBe(externalKey({ ...base, value_date: '2026-09-02' })); // value_date not part of the key (§11.16)
  });
});
