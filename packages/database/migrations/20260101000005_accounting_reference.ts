import type { Knex } from 'knex';

/** §11.18 account_categories · §11.19 chart_account_mappings — global reference data */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('account_categories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('code', 50).notNullable().unique();
    t.string('name_de', 150).notNullable();
    t.string('name_en', 150).notNullable();
    t.string('type', 30).notNullable();
    t.boolean('active').notNullable().defaultTo(true);
  });
  await knex.raw(
    `ALTER TABLE account_categories ADD CONSTRAINT account_categories_type_check CHECK (type IN ('REVENUE','EXPENSE'))`,
  );

  await knex.schema.createTable('chart_account_mappings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('category_id')
      .notNullable()
      .references('id')
      .inTable('account_categories')
      .onDelete('CASCADE');
    t.string('chart', 10).notNullable();
    t.integer('fiscal_year').notNullable();
    t.string('account_number', 20).notNullable();
    t.string('euer_code', 50).nullable();
    t.unique(['category_id', 'chart', 'fiscal_year']);
  });
  await knex.raw(
    `ALTER TABLE chart_account_mappings ADD CONSTRAINT cam_chart_check CHECK (chart IN ('SKR03','SKR04'))`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('chart_account_mappings');
  await knex.schema.dropTableIfExists('account_categories');
}
