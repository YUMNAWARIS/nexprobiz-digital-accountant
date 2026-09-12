import type { Knex } from 'knex';

/** §11.17 reconciliations */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reconciliations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    t.uuid('bank_transaction_id').notNullable().references('id').inTable('bank_transactions');

    t.string('target_type', 30).notNullable();
    t.uuid('target_id').notNullable();

    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // §11.17 — "Transaction cannot reconcile twice."
    t.unique(['bank_transaction_id']);
    t.index(['tenant_id', 'target_type', 'target_id']);
  });
  await knex.raw(
    `ALTER TABLE reconciliations ADD CONSTRAINT reconciliations_target_type_check CHECK (target_type IN ('PAYMENT','EXPENSE'))`,
  );
  // A payment or expense can be matched by at most one bank transaction.
  await knex.raw(
    'CREATE UNIQUE INDEX reconciliations_one_per_target ON reconciliations (target_type, target_id)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reconciliations');
}
