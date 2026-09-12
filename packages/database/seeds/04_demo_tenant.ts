import type { Knex } from 'knex';

/**
 * §54 — "Optionally create demo user only in explicit demo environments.
 *        Production/sandbox normal registration SHALL not depend on seed users."
 * Runs only when SEED_DEMO=true. Creates a user + tenant + OWNER membership and a business
 * profile so reviewers can log in without registering. No accounting records are created
 * (Story 17.4: never add fake accounting records automatically).
 *
 * The password hash is Argon2id and is computed by apps/api tooling (scripts/hash-password.ts)
 * — this seed does not depend on argon2 so the database package stays free of it.
 */
export const DEMO_USER = {
  email: 'reviewer@example.com',
  // argon2id hash of "StrongPassword123!" — regenerate with: pnpm --filter @fa/api hash-password
  password_hash: process.env.SEED_DEMO_PASSWORD_HASH ?? '',
};

export async function seed(knex: Knex): Promise<void> {
  if (process.env.SEED_DEMO !== 'true') {
    console.log('[seed] demo tenant skipped (SEED_DEMO != true)');
    return;
  }
  if (!DEMO_USER.password_hash) {
    throw new Error('[seed] SEED_DEMO=true requires SEED_DEMO_PASSWORD_HASH (argon2id) to be set');
  }

  await knex.transaction(async (trx) => {
    const existing = await trx('users').where({ email: DEMO_USER.email }).first<{ id: string }>();
    if (existing) {
      console.log('[seed] demo user already exists, skipping');
      return;
    }
    const [user] = await trx('users')
      .insert({
        email: DEMO_USER.email,
        password_hash: DEMO_USER.password_hash,
        status: 'ACTIVE',
      })
      .returning<{ id: string }[]>('id');
    const [tenant] = await trx('tenants')
      .insert({ name: 'Demo Freelancer', status: 'ACTIVE' })
      .returning<{ id: string }[]>('id');
    await trx('tenant_memberships').insert({
      tenant_id: tenant!.id,
      user_id: user!.id,
      role: 'OWNER',
    });

    // RLS: the seed runs as the owner role, which FORCE RLS also binds — set the tenant.
    await trx.raw("SELECT set_config('app.tenant_id', ?, true)", [tenant!.id]);
    await trx('business_profile_versions').insert({
      tenant_id: tenant!.id,
      version: 1,
      legal_name: 'Anna Beispiel',
      business_name: 'Anna Design',
      business_type: 'FREIBERUFLER',
      street: 'Example Str. 1',
      postal_code: '96047',
      city: 'Bamberg',
      country: 'DE',
      email: DEMO_USER.email,
      tax_number: '123/456/78900',
      vat_id: 'DE123456789',
      vat_regime: 'REGULAR',
      vat_taxation_method: 'IST',
      chart_of_accounts: 'SKR03',
      invoice_prefix: '',
      payment_term_days: 14,
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      bank_name: 'Commerzbank',
    });
    console.log(`[seed] demo tenant created: ${DEMO_USER.email}`);
  });
}
