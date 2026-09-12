/** Shared fixtures for integration tests. All calls go through HTTP so tenant isolation is exercised end-to-end. */
import { randomUUID } from 'node:crypto';
import type { Harness } from './harness';

export const PROFILE_REGULAR = {
  legalName: 'Anna Beispiel',
  businessName: 'Anna Design',
  businessType: 'FREIBERUFLER',
  address: { street: 'Example Str. 1', postalCode: '96047', city: 'Bamberg', country: 'DE' },
  email: 'anna@example.com',
  taxNumber: '123/456/78900',
  vatId: 'DE123456789',
  vatRegime: 'REGULAR',
  vatTaxationMethod: 'IST',
  chartOfAccounts: 'SKR03',
  invoicePrefix: '',
  paymentTermDays: 14,
  iban: 'DE89370400440532013000',
  bic: 'COBADEFFXXX',
  bankName: 'Commerzbank',
};
export const PROFILE_KLEINUNTERNEHMER = {
  ...PROFILE_REGULAR,
  vatRegime: 'KLEINUNTERNEHMER',
  vatTaxationMethod: null,
  vatId: null,
};

export const CLIENT = {
  name: 'Example GmbH',
  contactName: 'Max Mustermann',
  email: 'max@example.de',
  street: 'Teststraße 5',
  postalCode: '10115',
  city: 'Berlin',
  country: 'DE',
  vatId: 'DE987654321',
  paymentTermDays: 14,
};

let n = 0;
export async function registerUser(
  h: Harness,
  email = `user${++n}-${randomUUID().slice(0, 8)}@example.com`,
) {
  const r = await h.http
    .post('/api/v1/auth/register')
    .send({ email, password: 'StrongPassword123!' });
  if (r.status !== 201) throw new Error(`register failed: ${r.status} ${JSON.stringify(r.body)}`);
  const me = await h.http.get('/api/v1/me').set(auth(r.body.accessToken as string));
  return {
    email,
    token: r.body.accessToken as string,
    refreshToken: r.body.refreshToken as string,
    userId: r.body.user.id as string,
    tenantId: me.body.tenantId as string,
  };
}
export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function setupTenant(h: Harness, profile: Record<string, unknown> = PROFILE_REGULAR) {
  const u = await registerUser(h);
  const p = await h.http.put('/api/v1/business-profile').set(auth(u.token)).send(profile);
  if (p.status !== 200) throw new Error(`profile failed: ${JSON.stringify(p.body)}`);
  const c = await h.http.post('/api/v1/clients').set(auth(u.token)).send(CLIENT);
  if (c.status !== 201) throw new Error(`client failed: ${JSON.stringify(c.body)}`);
  return { ...u, profileId: p.body.id as string, clientId: c.body.id as string };
}

export const invoice100 = (clientId: string, taxTreatment = 'STANDARD_19') => ({
  clientId,
  issueDate: '2026-09-06',
  serviceDate: '2026-09-06',
  dueDate: '2026-09-20',
  lines: [
    {
      description: 'Software development services',
      quantity: '1.0000',
      unit: 'hour',
      unitPrice: '100.0000',
      taxTreatment,
    },
  ],
  notes: 'Thank you.',
});

export async function finalizedInvoice(
  h: Harness,
  token: string,
  clientId: string,
  body = invoice100(clientId),
) {
  const d = await h.http.post('/api/v1/invoices').set(auth(token)).send(body);
  if (d.status !== 201) throw new Error(`draft failed: ${JSON.stringify(d.body)}`);
  const f = await h.http.post(`/api/v1/invoices/${d.body.id}/finalize`).set(auth(token)).send({});
  if (f.status !== 200) throw new Error(`finalize failed: ${JSON.stringify(f.body)}`);
  return { id: d.body.id as string, ...f.body } as {
    id: string;
    invoiceNumber: string;
    grossTotal: string;
    taxTotal: string;
    subtotalNet: string;
    status: string;
  };
}

/** TEST-ACC-001 helper: every journal entry in the DB balances. */
export async function assertAllJournalsBalanced(h: Harness) {
  const rows = await h.adminDb.raw(`
    SELECT je.id, SUM(CASE WHEN jl.direction='DEBIT' THEN jl.amount ELSE -jl.amount END) AS delta
    FROM journal_entries je JOIN journal_lines jl ON jl.journal_entry_id = je.id
    GROUP BY je.id HAVING SUM(CASE WHEN jl.direction='DEBIT' THEN jl.amount ELSE -jl.amount END) <> 0`);
  expect(rows.rows).toEqual([]);
}
