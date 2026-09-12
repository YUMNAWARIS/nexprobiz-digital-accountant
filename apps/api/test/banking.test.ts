import { createHarness, type Harness } from './setup/harness';
import { auth, registerUser, setupTenant } from './setup/fixtures';

const HEADER = 'booking_date,value_date,description,counterparty,amount,currency';
const csv = (...rows: string[]) => Buffer.from([HEADER, ...rows].join('\n'), 'utf8');

describe('Epic 10 — Bank CSV import & classification (§26, §27)', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
  });
  afterAll(async () => h.close());

  const upload = (token: string, buf: Buffer) =>
    h.http.post('/api/v1/bank-imports').set(auth(token)).attach('file', buf, 'bank.csv');

  it('template is downloadable with the exact §26 header', async () => {
    const t = await registerUser(h);
    const r = await h.http.get('/api/v1/bank-imports/template').set(auth(t.token));
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toMatch(/text\/csv/);
    expect(r.text.split('\n')[0]).toBe(HEADER);
  });

  it('Story 10.1: valid rows imported, malformed rows reported with their line number', async () => {
    const t = await setupTenant(h);
    const r = await upload(
      t.token,
      csv(
        '2026-09-10,2026-09-10,Invoice INV-2026-000001,ACME GmbH,119.00,EUR',
        '2026-13-45,,bad date,X,1.00,EUR',
        '2026-09-11,,Adobe,Adobe Systems,-59.50,EUR',
        '2026-09-11,,bad amount,X,abc,EUR',
      ),
    );
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ rows: 4, imported: 2, duplicates: 0, failed: 2 });
    expect(r.body.errors.map((e: { line: number }) => e.line)).toEqual([3, 5]);
    const list = await h.http.get('/api/v1/bank-transactions').set(auth(t.token));
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(2);
    expect(
      list.body.data.every((b: { classification: string }) => b.classification === 'UNREVIEWED'),
    ).toBe(true);
  });

  it('Story 10.2 / TEST-ACC-010: re-importing the same file imports 0 and reports all as duplicates', async () => {
    const t = await setupTenant(h);
    const file = csv('2026-09-10,,Invoice,ACME,119.00,EUR', '2026-09-11,,Adobe,Adobe,-59.50,EUR');
    const first = await upload(t.token, file);
    expect(first.body).toMatchObject({ imported: 2, duplicates: 0 });
    const second = await upload(t.token, file);
    expect(second.body).toMatchObject({ rows: 2, imported: 0, duplicates: 2, failed: 0 });
    const rows = await h
      .adminDb('bank_transactions')
      .where({ tenant_id: t.tenantId })
      .count('* as n');
    expect(Number(rows[0]!.n)).toBe(2);
  });

  it('header mismatch → 400 BANK_CSV_HEADER_MISMATCH', async () => {
    const t = await registerUser(h);
    const r = await upload(t.token, Buffer.from('date,amount\n2026-09-10,1.00', 'utf8'));
    expect(r.status).toBe(400);
    expect(r.body.code).toBe('BANK_CSV_HEADER_MISMATCH');
  });

  it('Story 10.3: classification change persists, is audited, and list filters by classification', async () => {
    const t = await setupTenant(h);
    await upload(
      t.token,
      csv('2026-09-10,,Invoice,ACME,119.00,EUR', '2026-09-12,,Groceries,REWE,-25.00,EUR'),
    );
    const list = await h.http.get('/api/v1/bank-transactions').set(auth(t.token));
    const [a, b] = list.body.data as { id: string; description: string }[];
    const r = await h.http
      .patch(`/api/v1/bank-transactions/${a!.id}/classification`)
      .set(auth(t.token))
      .send({ classification: 'BUSINESS' });
    expect(r.status).toBe(200);
    expect(r.body.classification).toBe('BUSINESS');
    await h.http
      .patch(`/api/v1/bank-transactions/${b!.id}/classification`)
      .set(auth(t.token))
      .send({ classification: 'PERSONAL' });
    const biz = await h.http
      .get('/api/v1/bank-transactions?classification=BUSINESS')
      .set(auth(t.token));
    expect(biz.body.data.map((x: { id: string }) => x.id)).toEqual([a!.id]);
    const audit = await h
      .adminDb('audit_events')
      .where({ tenant_id: t.tenantId, event_type: 'BANK_TRANSACTION_CLASSIFIED' })
      .count('* as n');
    expect(Number(audit[0]!.n)).toBe(2);
  });

  it('TEST-ACC-009: another tenant cannot see or classify a bank transaction (404)', async () => {
    const a = await setupTenant(h);
    const b = await registerUser(h);
    await upload(a.token, csv('2026-09-10,,Invoice,ACME,119.00,EUR'));
    const list = await h.http.get('/api/v1/bank-transactions').set(auth(a.token));
    const id = list.body.data[0].id as string;
    expect((await h.http.get(`/api/v1/bank-transactions/${id}`).set(auth(b.token))).status).toBe(
      404,
    );
    expect(
      (
        await h.http
          .patch(`/api/v1/bank-transactions/${id}/classification`)
          .set(auth(b.token))
          .send({ classification: 'BUSINESS' })
      ).status,
    ).toBe(404);
    expect((await h.http.get('/api/v1/bank-transactions').set(auth(b.token))).body.data).toEqual(
      [],
    );
  });
});
