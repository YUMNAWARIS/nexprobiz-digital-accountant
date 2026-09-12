import { createHarness, type Harness } from './setup/harness';
import {
  auth,
  finalizedInvoice,
  invoice100,
  PROFILE_KLEINUNTERNEHMER,
  setupTenant,
} from './setup/fixtures';

describe('Epic 12 — Reporting (§29 dashboard, §30 EÜR, §31 VAT) — invoice side', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
  });
  afterAll(() => h.close());

  it('Story 12.1/12.2/12.3: two finalized invoices, one cancelled → revenue counts only the live one', async () => {
    const t = await setupTenant(h);
    await finalizedInvoice(h, t.token, t.clientId); // 100 + 19
    const b = await finalizedInvoice(h, t.token, t.clientId, invoice100(t.clientId, 'REDUCED_7')); // 100 + 7
    await h.http.post(`/api/v1/invoices/${b.id}/cancel`).set(auth(t.token)).send({ reason: 'x' });

    const d = await h.http.get('/api/v1/dashboard?year=2026').set(auth(t.token));
    expect(d.status).toBe(200);
    expect(d.body).toMatchObject({
      year: 2026,
      revenue: '100.00',
      expenses: '0.00',
      profit: '100.00',
      outstandingInvoices: '119.00',
      vat: { outputVat: '19.00', inputVat: '0.00', payable: '19.00' },
      workItems: { unreviewedBankTransactions: 0, receiptsNeedingReview: 0, draftExpenses: 0 },
    });

    const e = await h.http.get('/api/v1/reports/euer?year=2026').set(auth(t.token));
    expect(e.body).toEqual({
      year: 2026,
      income: { services: '100.00', total: '100.00' },
      expenses: [],
      totalExpenses: '0.00',
      profit: '100.00',
    });

    const v = await h.http.get('/api/v1/reports/vat?year=2026').set(auth(t.token));
    expect(v.body).toEqual({
      year: 2026,
      vatRegime: 'REGULAR',
      outputVat: '19.00',
      inputVat: '0.00',
      netVat: '19.00',
    });

    const other = await h.http.get('/api/v1/dashboard?year=2025').set(auth(t.token));
    expect(other.body.revenue).toBe('0.00');
  });

  it('Story 12.3: Kleinunternehmer → 0 / 0 / 0', async () => {
    const t = await setupTenant(h, PROFILE_KLEINUNTERNEHMER);
    await finalizedInvoice(h, t.token, t.clientId);
    const v = await h.http.get('/api/v1/reports/vat?year=2026').set(auth(t.token));
    expect(v.body).toEqual({
      year: 2026,
      vatRegime: 'KLEINUNTERNEHMER',
      outputVat: '0.00',
      inputVat: '0.00',
      netVat: '0.00',
    });
    const d = await h.http.get('/api/v1/dashboard?year=2026').set(auth(t.token));
    expect(d.body).toMatchObject({ revenue: '100.00', vat: { payable: '0.00' } });
  });

  it('year is required and validated', async () => {
    const t = await setupTenant(h);
    expect((await h.http.get('/api/v1/dashboard').set(auth(t.token))).status).toBe(400);
  });
});
