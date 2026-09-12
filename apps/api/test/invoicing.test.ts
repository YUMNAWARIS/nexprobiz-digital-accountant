import { createHarness, type Harness } from './setup/harness';
import {
  assertAllJournalsBalanced,
  auth,
  finalizedInvoice,
  invoice100,
  PROFILE_KLEINUNTERNEHMER,
  setupTenant,
} from './setup/fixtures';

describe('Epic 5 — Invoicing core (§22, §13, §14)', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
  });
  afterAll(async () => {
    await assertAllJournalsBalanced(h); // TEST-ACC-001 over everything this suite produced
    await h.close();
  });

  it('Story 5.1: draft with multiple lines; backend computes totals; client totals are rejected', async () => {
    const t = await setupTenant(h);
    const r = await h.http
      .post('/api/v1/invoices')
      .set(auth(t.token))
      .send({
        clientId: t.clientId,
        issueDate: '2026-09-06',
        lines: [
          {
            description: 'Dev',
            quantity: '10.0000',
            unit: 'hour',
            unitPrice: '80.0000',
            taxTreatment: 'STANDARD_19',
          },
          {
            description: 'Book',
            quantity: '2',
            unit: 'piece',
            unitPrice: '25.00',
            taxTreatment: 'REDUCED_7',
          },
        ],
      });
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      status: 'DRAFT',
      invoiceNumber: null,
      subtotalNet: '850.00',
      taxTotal: '155.50',
      grossTotal: '1005.50',
      outstandingAmount: '1005.50',
      dueDate: '2026-09-20',
    });
    expect(
      r.body.lines.map((l: { netAmount: string; taxAmount: string }) => [l.netAmount, l.taxAmount]),
    ).toEqual([
      ['800.00', '152.00'],
      ['50.00', '3.50'],
    ]);

    const tampered = await h.http
      .post('/api/v1/invoices')
      .set(auth(t.token))
      .send({ ...invoice100(t.clientId), grossTotal: '1.00' });
    expect(tampered.status).toBe(400);
  });

  it('Story 5.3 + 5.4: finalize allocates 2026-000001 / 000002, snapshots client, posts journal, audits; PATCH → 409', async () => {
    const t = await setupTenant(h);
    const a = await finalizedInvoice(h, t.token, t.clientId);
    const b = await finalizedInvoice(h, t.token, t.clientId);
    expect([a.invoiceNumber, b.invoiceNumber]).toEqual(['2026-000001', '2026-000002']);
    expect(a).toMatchObject({
      status: 'FINALIZED',
      subtotalNet: '100.00',
      taxTotal: '19.00',
      grossTotal: '119.00',
    }); // TEST-ACC-002

    const g = await h.http.get(`/api/v1/invoices/${a.id}`).set(auth(t.token));
    expect(g.body.clientSnapshot).toEqual({
      name: 'Example GmbH',
      street: 'Teststraße 5',
      postalCode: '10115',
      city: 'Berlin',
      country: 'DE',
      vatId: 'DE987654321',
    });

    const je = await h.adminDb('journal_entries').where({ source_id: a.id }).first();
    const lines = await h
      .adminDb('journal_lines')
      .where({ journal_entry_id: je!.id })
      .orderBy('account_number');
    expect(lines.map((l) => [l.account_number, l.direction, l.amount])).toEqual([
      ['1400', 'DEBIT', '119.00'],
      ['1776', 'CREDIT', '19.00'],
      ['8400', 'CREDIT', '100.00'],
    ]);

    const audit = await h.http.get(`/api/v1/audit?entityId=${a.id}`).set(auth(t.token));
    expect(audit.body.data[0]).toMatchObject({
      eventType: 'INVOICE_FINALIZED',
      metadata: { invoiceNumber: '2026-000001' },
    });
    const outbox = await h
      .adminDb('outbox_events')
      .where({ aggregate_id: a.id, event_type: 'InvoiceFinalized' })
      .first();
    expect(outbox!.published_at).not.toBeNull();

    const patch = await h.http
      .patch(`/api/v1/invoices/${a.id}`)
      .set(auth(t.token))
      .send({ notes: 'x' }); // TEST-ACC-006
    expect(patch.status).toBe(409);
    expect(patch.body.code).toBe('INVOICE_FINALIZED');
  });

  it('Story 5.3: concurrent finalization does not duplicate numbers', async () => {
    const t = await setupTenant(h);
    const drafts = await Promise.all(
      Array.from({ length: 8 }, () =>
        h.http.post('/api/v1/invoices').set(auth(t.token)).send(invoice100(t.clientId)),
      ),
    );
    const results = await Promise.all(
      drafts.map((d) =>
        h.http.post(`/api/v1/invoices/${d.body.id}/finalize`).set(auth(t.token)).send({}),
      ),
    );
    const numbers = results.map((r) => r.body.invoiceNumber).sort();
    expect(new Set(numbers).size).toBe(8);
    expect(numbers).toEqual(
      Array.from({ length: 8 }, (_, i) => `2026-${String(i + 1).padStart(6, '0')}`),
    );
  });

  it('TEST-ACC-003: 7% invoice → 100 / 7 / 107', async () => {
    const t = await setupTenant(h);
    const f = await finalizedInvoice(h, t.token, t.clientId, invoice100(t.clientId, 'REDUCED_7'));
    expect([f.subtotalNet, f.taxTotal, f.grossTotal]).toEqual(['100.00', '7.00', '107.00']);
  });

  it('TEST-ACC-004 / §13.2: Kleinunternehmer → 100 / 0 / 100, no output VAT line, revenue on exempt account', async () => {
    const t = await setupTenant(h, PROFILE_KLEINUNTERNEHMER);
    const f = await finalizedInvoice(h, t.token, t.clientId, invoice100(t.clientId, 'STANDARD_19'));
    expect([f.subtotalNet, f.taxTotal, f.grossTotal]).toEqual(['100.00', '0.00', '100.00']);
    const g = await h.http.get(`/api/v1/invoices/${f.id}`).set(auth(t.token));
    expect(g.body.lines[0]).toMatchObject({
      taxTreatment: 'KLEINUNTERNEHMER_19',
      taxRate: '0.0000',
      taxAmount: '0.00',
    });
    const je = await h.adminDb('journal_entries').where({ source_id: f.id }).first();
    const lines = await h
      .adminDb('journal_lines')
      .where({ journal_entry_id: je!.id })
      .orderBy('account_number');
    expect(lines.map((l) => [l.account_number, l.direction, l.amount])).toEqual([
      ['1400', 'DEBIT', '100.00'],
      ['8200', 'CREDIT', '100.00'],
    ]);
  });

  it('Story 5.5 / TEST-ACC-007: cancel keeps original, retains reason, creates reversal, status CANCELLED', async () => {
    const t = await setupTenant(h);
    const f = await finalizedInvoice(h, t.token, t.clientId);
    const c = await h.http
      .post(`/api/v1/invoices/${f.id}/cancel`)
      .set(auth(t.token))
      .send({ reason: 'Invoice issued incorrectly.' });
    expect(c.status).toBe(200);
    expect(c.body).toMatchObject({
      status: 'CANCELLED',
      invoiceNumber: '2026-000001',
      grossTotal: '119.00',
      cancelledAt: expect.any(String),
    });
    const entries = await h
      .adminDb('journal_entries')
      .where({ source_id: f.id })
      .orderBy('created_at');
    expect(entries.map((e) => [e.status, e.reversal_of === null])).toEqual([
      ['REVERSED', true],
      ['POSTED', false],
    ]);
    expect(entries[1]!.reversal_of).toBe(entries[0]!.id);
    const rev = await h
      .adminDb('journal_lines')
      .where({ journal_entry_id: entries[1]!.id })
      .orderBy('account_number');
    expect(rev.map((l) => [l.account_number, l.direction, l.amount])).toEqual([
      ['1400', 'CREDIT', '119.00'],
      ['1776', 'DEBIT', '19.00'],
      ['8400', 'DEBIT', '100.00'],
    ]);
    const audit = await h.http.get(`/api/v1/audit?eventType=INVOICE_CANCELLED`).set(auth(t.token));
    expect(audit.body.data[0].metadata.reason).toBe('Invoice issued incorrectly.');
    const again = await h.http
      .post(`/api/v1/invoices/${f.id}/cancel`)
      .set(auth(t.token))
      .send({ reason: 'x' });
    expect(again.status).toBe(409);
  });

  it('finalize validation: draft without issue date is rejected in §18 shape', async () => {
    const t = await setupTenant(h);
    const d = await h.http
      .post('/api/v1/invoices')
      .set(auth(t.token))
      .send({ ...invoice100(t.clientId), issueDate: undefined });
    expect(d.status).toBe(201); // defaults to today
    expect(d.body.issueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('TEST-ACC-009: cross-tenant invoice access → 404 on get, patch, finalize, cancel', async () => {
    const a = await setupTenant(h);
    const b = await setupTenant(h);
    const inv = await finalizedInvoice(h, b.token, b.clientId);
    for (const [m, p, body] of [
      ['get', `/api/v1/invoices/${inv.id}`, undefined],
      ['patch', `/api/v1/invoices/${inv.id}`, { notes: 'x' }],
      ['post', `/api/v1/invoices/${inv.id}/finalize`, {}],
      ['post', `/api/v1/invoices/${inv.id}/cancel`, { reason: 'x' }],
    ] as const) {
      const r = await (h.http as any)[m](p).set(auth(a.token)).send(body);
      expect([m, p, r.status]).toEqual([m, p, 404]);
    }
    const list = await h.http.get('/api/v1/invoices').set(auth(a.token));
    expect(list.body.data).toEqual([]);
  });
});
