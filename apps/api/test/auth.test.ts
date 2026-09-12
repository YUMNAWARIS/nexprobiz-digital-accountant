import { createHarness, type Harness } from './setup/harness';
import { auth, registerUser } from './setup/fixtures';

describe('Epic 2 — Authentication and tenant isolation (§19)', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
  });
  afterAll(() => h.close());

  it('Story 2.1: register creates user + tenant + OWNER membership and returns tokens', async () => {
    const r = await h.http
      .post('/api/v1/auth/register')
      .send({ email: 'reviewer@example.com', password: 'StrongPassword123!' });
    expect(r.status).toBe(201);
    expect(r.body).toEqual({
      user: { id: expect.any(String), email: 'reviewer@example.com' },
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    const m = await h.adminDb('tenant_memberships').where({ user_id: r.body.user.id }).first();
    expect(m).toMatchObject({ role: 'OWNER' });
    const me = await h.http.get('/api/v1/me').set(auth(r.body.accessToken));
    expect(me.body).toEqual({
      id: r.body.user.id,
      email: 'reviewer@example.com',
      tenantId: m!.tenant_id,
    });
  });
  it('Story 2.1: duplicate email → 409 EMAIL_ALREADY_EXISTS', async () => {
    const r = await h.http
      .post('/api/v1/auth/register')
      .send({ email: 'Reviewer@Example.com', password: 'StrongPassword123!' });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('EMAIL_ALREADY_EXISTS');
  });
  it('SEC-003: tenant_id in a body is rejected with a 400 naming the field', async () => {
    const r = await h.http.post('/api/v1/auth/register').send({
      email: 'x@example.com',
      password: 'StrongPassword123!',
      tenantId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    });
    expect(r.status).toBe(400);
    expect(r.body.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'tenantId' })]),
    );
  });
  it('Story 2.2: login works; wrong password → 401; password hash never returned', async () => {
    const ok = await h.http
      .post('/api/v1/auth/login')
      .send({ email: 'reviewer@example.com', password: 'StrongPassword123!' });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      expiresIn: 900,
    });
    expect(JSON.stringify(ok.body)).not.toMatch(/argon2|password/i);
    const bad = await h.http
      .post('/api/v1/auth/login')
      .send({ email: 'reviewer@example.com', password: 'wrong' });
    expect(bad.status).toBe(401);
    const unknown = await h.http
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrong' });
    expect(unknown.body.message).toBe(bad.body.message);
    const stored = await h.adminDb('users').where({ email: 'reviewer@example.com' }).first();
    expect(stored!.password_hash).toMatch(/^\$argon2id\$/); // SEC-001
  });
  it('Story 2.3: refresh rotates; old refresh token fails; logout revokes', async () => {
    const u = await registerUser(h);
    const r1 = await h.http.post('/api/v1/auth/refresh').send({ refreshToken: u.refreshToken });
    expect(r1.status).toBe(200);
    expect(r1.body.refreshToken).not.toBe(u.refreshToken);
    const replay = await h.http.post('/api/v1/auth/refresh').send({ refreshToken: u.refreshToken });
    expect(replay.status).toBe(401);
    expect(replay.body.code).toBe('INVALID_REFRESH_TOKEN');
    const out = await h.http
      .post('/api/v1/auth/logout')
      .send({ refreshToken: r1.body.refreshToken });
    expect(out.status).toBe(204);
    const after = await h.http
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: r1.body.refreshToken });
    expect(after.status).toBe(401);
    // SEC-002: DB holds only a hash
    const sessions = await h.adminDb('sessions').where({ user_id: u.userId });
    for (const s of sessions) expect(s.refresh_token_hash).toMatch(/^[0-9a-f]{64}$/);
  });
  it('protected route without token → 401 in the §18 shape', async () => {
    const r = await h.http.get('/api/v1/me');
    expect(r.status).toBe(401);
    expect(r.body).toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
      requestId: expect.any(String),
    });
  });
});
