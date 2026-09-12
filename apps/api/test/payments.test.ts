import { createHarness, type Harness } from './setup/harness';
import {
  assertAllJournalsBalanced,
  auth,
  finalizedInvoice,
  invoice100,
  setupTenant,
} from './setup/fixtures';

describe('Epic 7 — Manual payments (§23, §13.3)', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
  });
  afterAll(async () => {
    await assertAllJournalsBalanced(h);
    await h.close();
  });

  const pay = (token: string, id: string, amount: string) =>
    h.http.post(`/api/v1/invoices/${id}/payments`).set(auth(token)).send({
      amount,
      paymentDate: '2026-09-10',
      paymentMethod: 'BANK_TRANSFER',
      reference: 'Transfer received',
    });

  it('Story 7.1: €119 + €119 → paid 119, outstanding 0, PAID; balanced Bank DR / AR CR journal', async () => {
    const t = await setupTenant(h);
    const f = await finalizedInvoice(h, t.token, t.clientId);
    const p = await pay(t.token, f.id, '119.00');
    expect(p.status).toBe(201);
    expect(p.body).toMatchObject({
      amount: '119.00',
      paymentMethod: 'BANK_TRANSFER',
      status: 'RECORDED',
      journalEntryId: expect.any(String),
    });
    const inv = await h.http.get(`/api/v1/invoices/${f.id}`).set(auth(t.token));
    expect(inv.body).toMatchObject({
      paidAmount: '119.00',
      outstandingAmount: '0.00',
      status: 'PAID',
    });
    const lines = await h
      .adminDb('journal_lines')
      .where({ journal_entry_id: p.body.journalEntryId })
      .orderBy('account_number');
    expect(lines.map((l) => [l.account_number, l.direction, l.amount])).toEqual([
      ['1200', 'DEBIT', '119.00'],
      ['1400', 'CREDIT', '119.00'],
    ]);
    const audit = await h.http.get('/api/v1/audit?eventType=PAYMENT_RECORDED').set(auth(t.token));
    expect(audit.body.data[0].metadata).toMatchObject({ amount: '119.00', newStatus: 'PAID' });
    const list = await h.http.get(`/api/v1/invoices/${f.id}/payments`).set(auth(t.token));
    expect(list.body.data).toHaveLength(1);
  });

  it('Story 7.2: €119 + €50 → paid 50, outstanding 69, PARTIALLY_PAID; then €69 → PAID', async () => {
    const t = await setupTenant(h);
    const f = await finalizedInvoice(h, t.token, t.clientId);
    await pay(t.token, f.id, '50.00');
    let inv = await h.http.get(`/api/v1/invoices/${f.id}`).set(auth(t.token));
    expect(inv.body).toMatchObject({
      paidAmount: '50.00',
      outstandingAmount: '69.00',
      status: 'PARTIALLY_PAID',
    });
    await pay(t.token, f.id, '69.00');
    inv = await h.http.get(`/api/v1/invoices/${f.id}`).set(auth(t.token));
    expect(inv.body).toMatchObject({
      paidAmount: '119.00',
      outstandingAmount: '0.00',
      status: 'PAID',
    });
  });

  it('§23 rules: amount > 0, amount <= outstanding, invoice != CANCELLED, draft rejected', async () => {
    const t = await setupTenant(h);
    const f = await finalizedInvoice(h, t.token, t.clientId);
    expect((await pay(t.token, f.id, '0.00')).status).toBe(400);
    expect((await pay(t.token, f.id, '-1.00')).status).toBe(400);
    const over = await pay(t.token, f.id, '119.01');
    expect(over.status).toBe(409);
    expect(over.body.code).toBe('PAYMENT_EXCEEDS_OUTSTANDING');
    await h.http.post(`/api/v1/invoices/${f.id}/cancel`).set(auth(t.token)).send({ reason: 'x' });
    expect((await pay(t.token, f.id, '10.00')).body.code).toBe('INVOICE_CANCELLED');
    const d = await h.http.post('/api/v1/invoices').set(auth(t.token)).send(invoice100(t.clientId));
    expect((await pay(t.token, d.body.id, '10.00')).body.code).toBe('INVOICE_NOT_FINALIZED');
  });

  it('TEST-ACC-009: cross-tenant payment → 404', async () => {
    const a = await setupTenant(h);
    const b = await setupTenant(h);
    const f = await finalizedInvoice(h, b.token, b.clientId);
    expect((await pay(a.token, f.id, '1.00')).status).toBe(404);
    expect((await h.http.get(`/api/v1/invoices/${f.id}/payments`).set(auth(a.token))).status).toBe(
      404,
    );
  });
});
