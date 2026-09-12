import type { Knex } from 'knex';

/** §11.5 business_profile_versions — versioned, never overwritten (§20 PUT creates a new version) */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('business_profile_versions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    t.integer('version').notNullable();

    t.string('legal_name', 200).notNullable();
    t.string('business_name', 200).nullable();
    t.string('business_type', 30).notNullable();

    t.string('street', 200).notNullable();
    t.string('postal_code', 20).notNullable();
    t.string('city', 100).notNullable();
    t.specificType('country', 'char(2)').notNullable().defaultTo('DE');

    t.string('email', 320).nullable();
    t.string('phone', 50).nullable();

    t.string('tax_number', 50).nullable();
    t.string('vat_id', 30).nullable();

    t.string('vat_regime', 30).notNullable();
    t.string('vat_taxation_method', 20).nullable();
    t.string('chart_of_accounts', 10).notNullable();

    t.string('invoice_prefix', 20).notNullable().defaultTo('');
    t.integer('payment_term_days').notNullable().defaultTo(14);

    t.string('iban', 34).nullable();
    t.string('bic', 11).nullable();
    t.string('bank_name', 100).nullable();

    t.timestamp('effective_from', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('effective_to', { useTz: true }).nullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['tenant_id', 'version']);
    t.index(['tenant_id', 'effective_to']);
  });

  await knex.raw(`
    ALTER TABLE business_profile_versions
      ADD CONSTRAINT bpv_business_type_check CHECK (business_type IN ('FREIBERUFLER','GEWERBETREIBENDER')),
      ADD CONSTRAINT bpv_vat_regime_check CHECK (vat_regime IN ('KLEINUNTERNEHMER','REGULAR')),
      ADD CONSTRAINT bpv_vat_taxation_method_check CHECK (vat_taxation_method IS NULL OR vat_taxation_method IN ('IST','SOLL')),
      ADD CONSTRAINT bpv_chart_check CHECK (chart_of_accounts IN ('SKR03','SKR04'))
  `);
  // Exactly one current version per tenant.
  await knex.raw(
    'CREATE UNIQUE INDEX bpv_one_current_per_tenant ON business_profile_versions (tenant_id) WHERE effective_to IS NULL',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('business_profile_versions');
}
