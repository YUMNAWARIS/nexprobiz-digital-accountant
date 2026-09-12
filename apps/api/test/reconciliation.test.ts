import { createHarness, type Harness } from './setup/harness';
import { auth, finalizedInvoice, setupTenant } from './setup/fixtures';

const HEADER = 'booking_date,value_date,description,counterparty,amount,currency';

describe('Epic 11 — Reconciliation (§28)', () => {
  let h: Harness;
  let categories: Record<string, string>;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
    const cats = await h.adminDb('account_categories').select('id', 'code');
    categories = Object.fromEntries(cats.map((c) => [c.code as string, c.id as string]));
  });
  afterAll(async () => h.close());

  async function importRows(token: string, ...rows: string[]) {
    const r = await h.http
      .post('/api/v1/bank-imports')
      .set(auth(token))
      .attach('file', Buffer.from([HEADER, ...rows].join('\n'), 'utf8'), 'bank.csv');
    if (r.status !== 200) throw new Error(JSON.stringify(r.body));
    const list = await h.http.get('/api/v1/bank-transactions').set(auth(token));
    return list.body.data as { id: string; amount: string }[];
  }
  const classify = (token: string, id: string, classification = 'BUSINESS') =>
    h.http
      .patch(`/api/v1/bank-transactions/${id}/classification`)
      .set(auth(token))
      .send({ classification });
  const reconcile = (token: string, body: Record<string, string>) =>
    h.http.post('/api/v1/reconciliations').set(auth(token)).send(body);

  async function paidInvoice(token: string, clientId: string) {
    const inv = await finalizedInvoice(h, token, clientId);
    const p = await h.http
      .post(`/api/v1/invoices/${inv.id}/payments`)
      .set(auth(token))
      .send({ amount: '119.00', paymentDate: '2026-09-10', paymentMethod: 'BANK_TRANSFER' });
    if (p.status !== 201) throw new Error(JSON.stringify(p.body));
    return { invoiceId: inv.id, paymentId: p.body.id as string };
  }
  async function postedExpense(token: string, gross = '59.50', net = '50.00', tax = '9.50') {
    const d = await h.http.post('/api/v1/expenses').set(auth(token)).send({
      merchant: 'Adobe',
      description: 'Creative Cloud',
      expenseDate: '2026-09-11',
      paymentDate: '2026-09-11',
      categoryId: categories.SOFTWARE,
      taxTreatment: 'STANDARD_19',
      netAmount: net,
      taxAmount: tax,
      grossAmount: gross,
      businessPercentage: '100.00',
    });
    if (d.status !== 201) throw new Error(JSON.stringify(d.body));
    const p = await h.http.post(`/api/v1/expenses/${d.body.id}/post`).set(auth(token)).send({});
    if (p.status !== 200) throw new Error(JSON.stringify(p.body));
    return d.body.id as string;
  }

  it('Story 11.1: €119 BUSINESS transaction reconciles with the €119 payment; cannot reconcile twice', async () => {
    const t = await setupTenant(h);
    const { paymentId } = await paidInvoice(t.token, t.clientId);
    const [bt] = await importRows(t.token, '2026-09-10,,Invoice INV,ACME,119.00,EUR');
    await classify(t.token, bt!.id);
    const r = await reconcile(t.token, {
      bankTransactionId: bt!.id,
      targetType: 'PAYMENT',
      targetId: paymentId,
    });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      bankTransactionId: bt!.id,
      targetType: 'PAYMENT',
      targetId: paymentId,
    });
    const view = await h.http.get(`/api/v1/bank-transactions/${bt!.id}`).set(auth(t.token));
    expect(view.body.reconciliation).toMatchObject({ targetType: 'PAYMENT', targetId: paymentId });
    const again = await reconcile(t.token, {
      bankTransactionId: bt!.id,
      targetType: 'PAYMENT',
      targetId: paymentId,
    });
    expect(again.status).toBe(409);
    const audit = await h
      .adminDb('audit_events')
      .where({ tenant_id: t.tenantId, event_type: 'TRANSACTION_RECONCILED' })
      .count('* as n');
    expect(Number(audit[0]!.n)).toBe(1);
    const reconciled = await h.http
      .get('/api/v1/bank-transactions?reconciled=true')
      .set(auth(t.token));
    expect(reconciled.body.data.map((x: { id: string }) => x.id)).toEqual([bt!.id]);
  });

  it('transaction not classified BUSINESS → 409; amount mismatch → 409 RECONCILIATION_AMOUNT_MISMATCH', async () => {
    const t = await setupTenant(h);
    const { paymentId } = await paidInvoice(t.token, t.clientId);
    const [bt] = await importRows(t.token, '2026-09-10,,Partial,ACME,100.00,EUR');
    const unclassified = await reconcile(t.token, {
      bankTransactionId: bt!.id,
      targetType: 'PAYMENT',
      targetId: paymentId,
    });
    expect(unclassified.status).toBe(409);
    await classify(t.token, bt!.id);
    const mismatch = await reconcile(t.token, {
      bankTransactionId: bt!.id,
      targetType: 'PAYMENT',
      targetId: paymentId,
    });
    expect(mismatch.status).toBe(409);
    expect(mismatch.body.code).toBe('RECONCILIATION_AMOUNT_MISMATCH');
  });

  it('Story 11.2: −59.50 bank row reconciles with the €59.50 POSTED expense (absolute amount)', async () => {
    const t = await setupTenant(h);
    const expenseId = await postedExpense(t.token);
    const [bt] = await importRows(t.token, '2026-09-11,,Adobe,Adobe,-59.50,EUR');
    await classify(t.token, bt!.id);
    const r = await reconcile(t.token, {
      bankTransactionId: bt!.id,
      targetType: 'EXPENSE',
      targetId: expenseId,
    });
    expect(r.status).toBe(201);
    expect(r.body.targetType).toBe('EXPENSE');
  });

  it('TEST-ACC-009: cannot reconcile against another tenant’s payment or transaction (404)', async () => {
    const a = await setupTenant(h);
    const b = await setupTenant(h);
    const { paymentId } = await paidInvoice(a.token, a.clientId);
    const [btB] = await importRows(b.token, '2026-09-10,,Invoice,ACME,119.00,EUR');
    await classify(b.token, btB!.id);
    const r = await reconcile(b.token, {
      bankTransactionId: btB!.id,
      targetType: 'PAYMENT',
      targetId: paymentId,
    });
    expect(r.status).toBe(404);
  });
});
