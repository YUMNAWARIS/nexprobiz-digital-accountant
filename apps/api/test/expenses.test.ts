import type request from 'supertest';
import { createHarness, type Harness } from './setup/harness';
import {
  assertAllJournalsBalanced,
  auth,
  PROFILE_KLEINUNTERNEHMER,
  setupTenant,
} from './setup/fixtures';

describe('Epic 9 — Expenses (§25, §15, §13.4/§13.5)', () => {
  let h: Harness;
  let categories: Record<string, string>;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
    const cats = await h.adminDb('account_categories').select('id', 'code');
    categories = Object.fromEntries(cats.map((c) => [c.code, c.id]));
  });
  afterAll(async () => {
    await assertAllJournalsBalanced(h);
    await h.close();
  });

  const adobe = () => ({
    merchant: 'Adobe',
    description: 'Creative Cloud subscription',
    expenseDate: '2026-09-01',
    paymentDate: '2026-09-01',
    categoryId: categories.SOFTWARE,
    taxTreatment: 'STANDARD_19',
    netAmount: '50.00',
    taxAmount: '9.50',
    grossAmount: '59.50',
    businessPercentage: '100.00',
  });

  it('Story 9.1: draft created; inconsistent amounts rejected; revenue category rejected; draft is editable', async () => {
    const t = await setupTenant(h);
    const r = await h.http.post('/api/v1/expenses').set(auth(t.token)).send(adobe());
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      status: 'DRAFT',
      categoryCode: 'SOFTWARE',
      categoryName: 'Software',
      grossAmount: '59.50',
      journalEntryId: null,
    });
    expect(
      (
        await h.http
          .post('/api/v1/expenses')
          .set(auth(t.token))
          .send({ ...adobe(), grossAmount: '60.00' })
      ).status,
    ).toBe(400);
    expect(
      (
        await h.http
          .post('/api/v1/expenses')
          .set(auth(t.token))
          .send({ ...adobe(), categoryId: categories.REVENUE_SERVICES })
      ).status,
    ).toBe(400);
    const u = await h.http.patch(`/api/v1/expenses/${r.body.id}`).set(auth(t.token)).send({
      merchant: 'Adobe Inc.',
      netAmount: '100.00',
      taxAmount: '19.00',
      grossAmount: '119.00',
    });
    expect(u.body).toMatchObject({ merchant: 'Adobe Inc.', grossAmount: '119.00' });
  });

  it('Story 9.2 / §13.4: post regular VAT → Expense DR 50 / Input VAT DR 9.50 / Bank CR 59.50; audit + outbox; TEST-ACC-005 posted is immutable', async () => {
    const t = await setupTenant(h);
    const r = await h.http.post('/api/v1/expenses').set(auth(t.token)).send(adobe());
    const p = await h.http.post(`/api/v1/expenses/${r.body.id}/post`).set(auth(t.token)).send({});
    expect(p.status).toBe(200);
    expect(p.body).toMatchObject({
      status: 'POSTED',
      journalEntryId: expect.any(String),
      postedAt: expect.any(String),
    });
    const lines = await h
      .adminDb('journal_lines')
      .where({ journal_entry_id: p.body.journalEntryId })
      .orderBy('account_number');
    expect(lines.map((l) => [l.account_number, l.direction, l.amount, l.category_code])).toEqual([
      ['1200', 'CREDIT', '59.50', null],
      ['1576', 'DEBIT', '9.50', null],
      ['4980', 'DEBIT', '50.00', 'SOFTWARE'],
    ]);
    const audit = await h.http.get('/api/v1/audit?eventType=EXPENSE_POSTED').set(auth(t.token));
    expect(audit.body.data[0].metadata).toMatchObject({ grossAmount: '59.50' });
    const e = await h.http
      .patch(`/api/v1/expenses/${r.body.id}`)
      .set(auth(t.token))
      .send({ merchant: 'x' });
    expect(e.status).toBe(409);
    expect(e.body.code).toBe('EXPENSE_NOT_DRAFT');
    expect(
      (await h.http.post(`/api/v1/expenses/${r.body.id}/post`).set(auth(t.token)).send({})).status,
    ).toBe(409);
  });

  it('§13.5: Kleinunternehmer expense → Expense DR 59.50 / Bank CR 59.50, no input VAT', async () => {
    const t = await setupTenant(h, PROFILE_KLEINUNTERNEHMER);
    const r = await h.http.post('/api/v1/expenses').set(auth(t.token)).send(adobe());
    const p = await h.http.post(`/api/v1/expenses/${r.body.id}/post`).set(auth(t.token)).send({});
    const lines = await h
      .adminDb('journal_lines')
      .where({ journal_entry_id: p.body.journalEntryId })
      .orderBy('account_number');
    expect(lines.map((l) => [l.account_number, l.direction, l.amount])).toEqual([
      ['1200', 'CREDIT', '59.50'],
      ['4980', 'DEBIT', '59.50'],
    ]);
  });

  it('business_percentage 50 → only the business share is posted', async () => {
    const t = await setupTenant(h);
    const r = await h.http
      .post('/api/v1/expenses')
      .set(auth(t.token))
      .send({ ...adobe(), categoryId: categories.TELEPHONE_INTERNET, businessPercentage: '50.00' });
    const p = await h.http.post(`/api/v1/expenses/${r.body.id}/post`).set(auth(t.token)).send({});
    const lines = await h
      .adminDb('journal_lines')
      .where({ journal_entry_id: p.body.journalEntryId })
      .orderBy('account_number');
    expect(lines.map((l) => [l.account_number, l.amount])).toEqual([
      ['1200', '29.75'],
      ['1576', '4.75'],
      ['4920', '25.00'],
    ]);
  });

  it('Story 9.3 / TEST-ACC-008: reverse creates the opposite journal; status REVERSED; original untouched', async () => {
    const t = await setupTenant(h);
    const r = await h.http.post('/api/v1/expenses').set(auth(t.token)).send(adobe());
    const p = await h.http.post(`/api/v1/expenses/${r.body.id}/post`).set(auth(t.token)).send({});
    const rv = await h.http
      .post(`/api/v1/expenses/${r.body.id}/reverse`)
      .set(auth(t.token))
      .send({ reason: 'Incorrect expense.' });
    expect(rv.status).toBe(200);
    expect(rv.body).toMatchObject({
      status: 'REVERSED',
      reversedAt: expect.any(String),
      grossAmount: '59.50',
    });
    const entries = await h
      .adminDb('journal_entries')
      .where({ source_id: r.body.id })
      .orderBy('created_at');
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ id: p.body.journalEntryId, status: 'REVERSED' });
    expect(entries[1]!.reversal_of).toBe(p.body.journalEntryId);
    const rev = await h
      .adminDb('journal_lines')
      .where({ journal_entry_id: entries[1]!.id })
      .orderBy('account_number');
    expect(rev.map((l) => [l.account_number, l.direction, l.amount])).toEqual([
      ['1200', 'DEBIT', '59.50'],
      ['1576', 'CREDIT', '9.50'],
      ['4980', 'CREDIT', '50.00'],
    ]);
    expect(
      (
        await h.http
          .post(`/api/v1/expenses/${r.body.id}/reverse`)
          .set(auth(t.token))
          .send({ reason: 'again' })
      ).body.code,
    ).toBe('EXPENSE_NOT_POSTED');
    const audit = await h.http.get('/api/v1/audit?eventType=EXPENSE_REVERSED').set(auth(t.token));
    expect(audit.body.data[0].metadata.reason).toBe('Incorrect expense.');
  });

  it('Story 9.1: confirmed receipt backs an expense; unconfirmed receipt rejected; one expense per receipt', async () => {
    const t = await setupTenant(h);
    const PNG = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64',
    );
    h.queue.handler = null;
    const up = await h.http
      .post('/api/v1/receipts')
      .set(auth(t.token))
      .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' });
    expect(
      (
        await h.http
          .post('/api/v1/expenses')
          .set(auth(t.token))
          .send({ ...adobe(), receiptId: up.body.id })
      ).body.code,
    ).toBe('RECEIPT_NOT_CONFIRMED');
    // receipt is OCR_PROCESSING; simulate worker completion then confirm
    await h.adminDb('receipts').where({ id: up.body.id }).update({ status: 'NEEDS_REVIEW' });
    await h.http.patch(`/api/v1/receipts/${up.body.id}/confirm`).set(auth(t.token)).send({
      merchant: 'Adobe',
      receiptDate: '2026-09-01',
      netAmount: '50.00',
      taxAmount: '9.50',
      grossAmount: '59.50',
    });
    const e = await h.http
      .post('/api/v1/expenses')
      .set(auth(t.token))
      .send({ ...adobe(), receiptId: up.body.id });
    expect(e.status).toBe(201);
    expect(
      (await h.http.get(`/api/v1/receipts/${up.body.id}`).set(auth(t.token))).body.expenseId,
    ).toBe(e.body.id);
    expect(
      (
        await h.http
          .post('/api/v1/expenses')
          .set(auth(t.token))
          .send({ ...adobe(), receiptId: up.body.id })
      ).status,
    ).toBe(409);
  });

  it('dashboard/EÜR reflect posted (not draft, not reversed) expenses — Story 12.1/12.2', async () => {
    const t = await setupTenant(h);
    await h.http.post('/api/v1/expenses').set(auth(t.token)).send(adobe()); // draft — must not count
    const posted = await h.http
      .post('/api/v1/expenses')
      .set(auth(t.token))
      .send({
        ...adobe(),
        categoryId: categories.TRAVEL,
        netAmount: '100.00',
        taxAmount: '7.00',
        grossAmount: '107.00',
        taxTreatment: 'REDUCED_7',
      });
    await h.http.post(`/api/v1/expenses/${posted.body.id}/post`).set(auth(t.token)).send({});
    const reversed = await h.http.post('/api/v1/expenses').set(auth(t.token)).send(adobe());
    await h.http.post(`/api/v1/expenses/${reversed.body.id}/post`).set(auth(t.token)).send({});
    await h.http
      .post(`/api/v1/expenses/${reversed.body.id}/reverse`)
      .set(auth(t.token))
      .send({ reason: 'x' });
    const d = await h.http.get('/api/v1/dashboard?year=2026').set(auth(t.token));
    expect(d.body).toMatchObject({
      expenses: '100.00',
      profit: '-100.00',
      vat: { inputVat: '7.00', payable: '-7.00' },
      workItems: { draftExpenses: 1 },
    });
    const e = await h.http.get('/api/v1/reports/euer?year=2026').set(auth(t.token));
    expect(e.body.expenses).toEqual([
      { categoryCode: 'TRAVEL', name: 'Reisekosten', amount: '100.00' },
    ]);
  });

  it('TEST-ACC-009: cross-tenant expense → 404', async () => {
    const a = await setupTenant(h);
    const b = await setupTenant(h);
    const r = await h.http.post('/api/v1/expenses').set(auth(b.token)).send(adobe());
    for (const [m, p] of [
      ['get', ''],
      ['patch', ''],
      ['post', '/post'],
      ['post', '/reverse'],
    ] as const) {
      const agent = h.http as unknown as Record<string, (url: string) => request.Test>;
      const res = await agent[m]!(`/api/v1/expenses/${r.body.id}${p}`)
        .set(auth(a.token))
        .send(p === '/reverse' ? { reason: 'x' } : {});
      expect([m, p, res.status]).toEqual([m, p, 404]);
    }
  });
});
