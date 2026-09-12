import { createHarness, type Harness } from './setup/harness';
import { auth, CLIENT, invoice100, setupTenant } from './setup/fixtures';

describe('Epic 4 — Clients (§21)', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
  });
  afterAll(() => h.close());

  it('Story 4.1: create, edit, list, search, archive; archived client cannot be used on a new invoice', async () => {
    const t = await setupTenant(h);
    const c = await h.http
      .post('/api/v1/clients')
      .set(auth(t.token))
      .send({ ...CLIENT, name: 'Zweite AG' });
    expect(c.status).toBe(201);
    const e = await h.http
      .patch(`/api/v1/clients/${c.body.id}`)
      .set(auth(t.token))
      .send({ city: 'München' });
    expect(e.body.city).toBe('München');
    const l = await h.http.get('/api/v1/clients?search=zweite').set(auth(t.token));
    expect(l.body.data).toHaveLength(1);
    expect(l.body.meta).toMatchObject({ page: 1, pageSize: 20, total: 1 });
    const d = await h.http.delete(`/api/v1/clients/${c.body.id}`).set(auth(t.token));
    expect(d.status).toBe(204);
    const g = await h.http.get(`/api/v1/clients/${c.body.id}`).set(auth(t.token));
    expect(g.body).toMatchObject({ status: 'ARCHIVED', archivedAt: expect.any(String) }); // archive only — row remains
    const inv = await h.http
      .post('/api/v1/invoices')
      .set(auth(t.token))
      .send(invoice100(c.body.id));
    expect(inv.status).toBe(409);
    expect(inv.body.code).toBe('CLIENT_ARCHIVED');
    const active = await h.http.get('/api/v1/clients?status=ACTIVE').set(auth(t.token));
    expect(active.body.data.map((x: { name: string }) => x.name)).toEqual(['Example GmbH']);
  });
  it('Story 2.4 / TEST-ACC-009: user A gets 404 for user B client', async () => {
    const a = await setupTenant(h);
    const b = await setupTenant(h);
    const r = await h.http.get(`/api/v1/clients/${b.clientId}`).set(auth(a.token));
    expect(r.status).toBe(404);
    const p = await h.http
      .patch(`/api/v1/clients/${b.clientId}`)
      .set(auth(a.token))
      .send({ city: 'X' });
    expect(p.status).toBe(404);
    const list = await h.http.get('/api/v1/clients').set(auth(a.token));
    expect(list.body.data.every((c: { id: string }) => c.id !== b.clientId)).toBe(true);
  });
});
