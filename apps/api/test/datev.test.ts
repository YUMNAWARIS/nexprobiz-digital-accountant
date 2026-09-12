import iconv from 'iconv-lite';
import { DATEV_COLUMNS, parseDatevCsv } from '../src/modules/datev';
import { createHarness, type Harness } from './setup/harness';
import { auth, finalizedInvoice, setupTenant } from './setup/fixtures';

describe('Epic 13 — DATEV export (§32, §33)', () => {
  let h: Harness;
  let categories: Record<string, string>;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
    const cats = await h.adminDb('account_categories').select('id', 'code');
    categories = Object.fromEntries(cats.map((c) => [c.code as string, c.id as string]));
  });
  afterAll(async () => h.close());

  const body = {
    periodStart: '2026-01-01',
    periodEnd: '2026-12-31',
    beraternummer: '12345',
    mandantennummer: '1',
  };
  const create = (token: string, b = body) =>
    h.http.post('/api/v1/exports/datev').set(auth(token)).send(b);

  it('Story 13.1: missing chart mapping blocks the export with DATEV_ACCOUNT_MAPPING_MISSING', async () => {
    const t = await setupTenant(h);
    await finalizedInvoice(h, t.token, t.clientId);
    const mappings = await h
      .adminDb('chart_account_mappings')
      .where({ category_id: categories.REVENUE_SERVICES, chart: 'SKR03', fiscal_year: 2026 })
      .select('*');
    await h
      .adminDb('chart_account_mappings')
      .where({ category_id: categories.REVENUE_SERVICES, chart: 'SKR03', fiscal_year: 2026 })
      .delete();
    try {
      const r = await create(t.token);
      expect(r.status).toBe(409);
      expect(r.body.code).toBe('DATEV_ACCOUNT_MAPPING_MISSING');
      const rows = await h.http.get('/api/v1/exports').set(auth(t.token));
      expect(rows.body.data[0].status).toBe('FAILED');
    } finally {
      await h.adminDb('chart_account_mappings').insert(mappings);
    }
  });

  it('Story 13.2: file generated, stored, downloadable, audited; parses; Soll = Haben; no drafts', async () => {
    const t = await setupTenant(h);
    const inv = await finalizedInvoice(h, t.token, t.clientId);
    await h.http
      .post(`/api/v1/invoices/${inv.id}/payments`)
      .set(auth(t.token))
      .send({ amount: '119.00', paymentDate: '2026-09-10', paymentMethod: 'BANK_TRANSFER' });
    const exp = await h.http.post('/api/v1/expenses').set(auth(t.token)).send({
      merchant: 'Adobe',
      description: 'Creative Cloud',
      expenseDate: '2026-09-11',
      paymentDate: '2026-09-11',
      categoryId: categories.SOFTWARE,
      taxTreatment: 'STANDARD_19',
      netAmount: '50.00',
      taxAmount: '9.50',
      grossAmount: '59.50',
      businessPercentage: '100.00',
    });
    await h.http.post(`/api/v1/expenses/${exp.body.id}/post`).set(auth(t.token)).send({});
    // a DRAFT expense that must not appear
    await h.http.post('/api/v1/expenses').set(auth(t.token)).send({
      merchant: 'Draft Co',
      description: 'never posted',
      expenseDate: '2026-09-12',
      categoryId: categories.OFFICE_SUPPLIES,
      taxTreatment: 'STANDARD_19',
      netAmount: '1000.00',
      taxAmount: '190.00',
      grossAmount: '1190.00',
      businessPercentage: '100.00',
    });
    // draft invoice that must not appear
    await h.http
      .post('/api/v1/invoices')
      .set(auth(t.token))
      .send({
        clientId: t.clientId,
        invoiceDate: '2026-09-12',
        serviceDate: '2026-09-12',
        lines: [
          {
            description: 'draft',
            quantity: '1',
            unitPrice: '5000.00',
            taxTreatment: 'STANDARD_19',
          },
        ],
      });

    const r = await create(t.token);
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({ status: 'COMPLETED' });
    expect(r.body.downloadUrl).toBe(`/api/v1/exports/${r.body.id}/download`);

    const view = await h.http.get(`/api/v1/exports/${r.body.id}`).set(auth(t.token));
    expect(view.body).toMatchObject({
      type: 'DATEV_BOOKINGS',
      status: 'COMPLETED',
      formatVersion: '700',
    });
    expect(view.body.documentId).toBeTruthy();

    const dl = await h.http
      .get(`/api/v1/exports/${r.body.id}/download`)
      .set(auth(t.token))
      .buffer(true)
      .parse((res, cb) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => cb(null, Buffer.concat(chunks)));
      });
    expect(dl.status).toBe(200);
    expect(dl.headers['content-disposition']).toMatch(/EXTF_Buchungsstapel_\d{8}\.csv/);
    const parsed = parseDatevCsv(iconv.decode(dl.body as Buffer, 'win1252'));
    expect(parsed.header[0]).toBe('EXTF');
    expect(parsed.header[1]).toBe('700');
    expect(parsed.header[2]).toBe('21');
    expect(parsed.columns).toEqual([...DATEV_COLUMNS]);
    const col = (name: (typeof DATEV_COLUMNS)[number]) => parsed.columns.indexOf(name);
    const [UMSATZ, SH, WKZ, KONTO, GEGENKONTO, BELEG1] = [
      col('Umsatz (ohne Soll/Haben-Kz)'),
      col('Soll/Haben-Kennzeichen'),
      col('WKZ Umsatz'),
      col('Konto'),
      col('Gegenkonto (ohne BU-Schlüssel)'),
      col('Belegfeld 1'),
    ];
    for (const c of [
      UMSATZ,
      SH,
      WKZ,
      KONTO,
      GEGENKONTO,
      BELEG1,
      col('Belegdatum'),
      col('Buchungstext'),
    ])
      expect(c).toBeGreaterThanOrEqual(0);
    // 3 posted entries: invoice (2 non-pivot lines), payment (1), expense (2)
    expect(parsed.rows.length).toBe(5);
    expect(parsed.rows.some((row) => row[BELEG1] === inv.invoiceNumber)).toBe(true);
    expect(parsed.rows.some((row) => row[UMSATZ] === '5000,00' || row[UMSATZ] === '1190,00')).toBe(
      false,
    );
    expect(parsed.rows.every((row) => row[WKZ] === 'EUR')).toBe(true);
    expect(parsed.rows.every((row) => row[SH] === 'S' || row[SH] === 'H')).toBe(true);
    // SKR03 accounts from the configured mapping
    const accounts = new Set(parsed.rows.flatMap((row) => [row[KONTO], row[GEGENKONTO]]));
    expect(accounts.has('8400')).toBe(true);
    expect(accounts.has('4980')).toBe(true);
    expect(accounts.has('1400')).toBe(true);
    expect(accounts.has('1200')).toBe(true);
    // Soll = Haben across the full batch (§33 acceptance)
    const balance = await h.adminDb.raw(
      `SELECT COALESCE(SUM(CASE WHEN jl.direction='DEBIT' THEN jl.amount ELSE -jl.amount END),0) AS d
       FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id WHERE je.tenant_id = ?`,
      [t.tenantId],
    );
    expect(String(balance.rows[0].d)).toMatch(/^0(\.00)?$/);

    const audit = await h
      .adminDb('audit_events')
      .where({ tenant_id: t.tenantId, event_type: 'DATEV_EXPORT_GENERATED' })
      .count('* as n');
    expect(Number(audit[0]!.n)).toBe(1);
    const list = await h.http.get('/api/v1/exports').set(auth(t.token));
    expect(list.body.data.map((e: { id: string }) => e.id)).toContain(r.body.id);
  });

  it('validation: bad Beraternummer → 400; TEST-ACC-009: export of another tenant → 404', async () => {
    const a = await setupTenant(h);
    const b = await setupTenant(h);
    expect((await create(a.token, { ...body, beraternummer: '12' })).status).toBe(400);
    await finalizedInvoice(h, a.token, a.clientId);
    const r = await create(a.token);
    expect(r.status).toBe(201);
    expect((await h.http.get(`/api/v1/exports/${r.body.id}`).set(auth(b.token))).status).toBe(404);
    expect(
      (await h.http.get(`/api/v1/exports/${r.body.id}/download`).set(auth(b.token))).status,
    ).toBe(404);
  });
});
