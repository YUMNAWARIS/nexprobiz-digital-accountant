import { createHarness, type Harness } from './setup/harness';
import {
  auth,
  finalizedInvoice,
  PROFILE_REGULAR,
  registerUser,
  setupTenant,
} from './setup/fixtures';

describe('Epic 3 — Business profile (§20)', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
  });
  afterAll(() => h.close());

  it('GET before onboarding → 404; PUT creates version 1; GET returns it', async () => {
    const u = await registerUser(h);
    expect((await h.http.get('/api/v1/business-profile').set(auth(u.token))).status).toBe(404);
    const p = await h.http.put('/api/v1/business-profile').set(auth(u.token)).send(PROFILE_REGULAR);
    expect(p.status).toBe(200);
    expect(p.body).toMatchObject({
      version: 1,
      legalName: 'Anna Beispiel',
      vatRegime: 'REGULAR',
      chartOfAccounts: 'SKR03',
      address: { city: 'Bamberg' },
    });
    const g = await h.http.get('/api/v1/business-profile').set(auth(u.token));
    expect(g.body.version).toBe(1);
    const audit = await h.http.get('/api/v1/audit').set(auth(u.token));
    expect(audit.body.data[0]).toMatchObject({
      eventType: 'BUSINESS_PROFILE_CHANGED',
      entityType: 'BUSINESS_PROFILE',
    });
  });
  it('REGULAR requires vatTaxationMethod', async () => {
    const u = await registerUser(h);
    const r = await h.http
      .put('/api/v1/business-profile')
      .set(auth(u.token))
      .send({ ...PROFILE_REGULAR, vatTaxationMethod: null });
    expect(r.status).toBe(400);
    expect(r.body.details[0].field).toBe('vatTaxationMethod');
  });
  it('Story 3.2: PUT creates version 2, keeps version 1, historical invoice still references version 1', async () => {
    const t = await setupTenant(h);
    const inv = await finalizedInvoice(h, t.token, t.clientId);
    const v1 = await h.http.get(`/api/v1/invoices/${inv.id}`).set(auth(t.token));
    expect(v1.body.businessProfileVersionId).toBe(t.profileId);

    const p2 = await h.http
      .put('/api/v1/business-profile')
      .set(auth(t.token))
      .send({ ...PROFILE_REGULAR, address: { ...PROFILE_REGULAR.address, street: 'Neue Str. 2' } });
    expect(p2.body.version).toBe(2);
    expect(p2.body.id).not.toBe(t.profileId);

    const tenantId = (await h.adminDb('tenant_memberships').where({ user_id: t.userId }).first())!
      .tenant_id;
    const versions = await h
      .adminDb('business_profile_versions')
      .where({ tenant_id: tenantId })
      .orderBy('version');
    expect(versions.map((v) => [v.version, v.street, v.effective_to === null])).toEqual([
      [1, 'Example Str. 1', false],
      [2, 'Neue Str. 2', true],
    ]);
    const still = await h.http.get(`/api/v1/invoices/${inv.id}`).set(auth(t.token));
    expect(still.body.businessProfileVersionId).toBe(t.profileId);
  });
  it('Story 3.1: cannot create an invoice without a completed profile', async () => {
    const u = await registerUser(h);
    const r = await h.http
      .post('/api/v1/invoices')
      .set(auth(u.token))
      .send({
        clientId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        lines: [{ description: 'x', quantity: '1', unitPrice: '1', taxTreatment: 'STANDARD_19' }],
      });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('BUSINESS_PROFILE_INCOMPLETE');
  });
});
