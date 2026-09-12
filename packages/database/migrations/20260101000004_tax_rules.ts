import type { Knex } from 'knex';

/** §11.22 tax_rule_sets · §11.23 tax_rule_values — global reference data, not tenant-owned */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tax_rule_sets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('jurisdiction', 10).notNullable();
    t.integer('tax_year').notNullable();
    t.integer('version').notNullable();
    t.boolean('active').notNullable();
    t.unique(['jurisdiction', 'tax_year', 'version']);
  });
  // At most one active rule set per jurisdiction+year.
  await knex.raw(
    'CREATE UNIQUE INDEX tax_rule_sets_one_active ON tax_rule_sets (jurisdiction, tax_year) WHERE active = true',
  );

  await knex.schema.createTable('tax_rule_values', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('rule_set_id')
      .notNullable()
      .references('id')
      .inTable('tax_rule_sets')
      .onDelete('CASCADE');
    t.string('rule_key', 100).notNullable();
    t.jsonb('value_json').notNullable();
    t.unique(['rule_set_id', 'rule_key']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tax_rule_values');
  await knex.schema.dropTableIfExists('tax_rule_sets');
}
