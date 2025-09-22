/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {

  await knex.schema.createTable('businesses', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.text('name').notNullable();
    table.text('email').notNullable();
    table.jsonb('data').defaultTo({}).notNullable();
    table.timestamps(true, true);
  });


  await knex.schema.createTable('fiscal_years', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('business_id').notNullable().references('id').inTable('businesses').onDelete('CASCADE');
    table.text('year_label').notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.boolean('is_closed').notNullable().defaultTo(false);
    table.unique(['business_id', 'year_label']);
  });

  await knex.schema.createTable('fiscal_periods', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('fiscal_year_id').notNullable().references('id').inTable('fiscal_years').onDelete('CASCADE');
    table.integer('period_no').notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.boolean('is_closed').notNullable().defaultTo(false);
    table.unique(['fiscal_year_id', 'period_no']);
  });

  await knex.schema.alterTable('users', function(table) {
    table.uuid('business_id').references('id').inTable('businesses').onDelete('CASCADE').defaultTo(null);
  });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('fiscal_periods');
  await knex.schema.dropTableIfExists('fiscal_years');
  await knex.schema.alterTable('users', function(table) {
    table.dropColumn('business_id');
  });
  await knex.schema.dropTableIfExists('businesses');
};
