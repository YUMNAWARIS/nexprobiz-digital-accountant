import type { Knex } from 'knex';

/** §11.14 expenses */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('expenses', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE');
    t.uuid('receipt_id').nullable().references('id').inTable('receipts');

    t.string('status', 30).notNullable();

    t.string('merchant', 200).notNullable();
    t.text('description').nullable();
    t.date('expense_date').notNullable();
    t.date('payment_date').nullable();

    t.uuid('category_id').notNullable().references('id').inTable('account_categories');
    t.string('tax_treatment', 40).notNullable();

    t.decimal('net_amount', 15, 2).notNullable();
    t.decimal('tax_amount', 15, 2).notNullable();
    t.decimal('gross_amount', 15, 2).notNullable();

    t.decimal('business_percentage', 5, 2).notNullable().defaultTo(100);

    t.timestamp('posted_at', { useTz: true }).nullable();
    t.timestamp('reversed_at', { useTz: true }).nullable();

    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index(['tenant_id', 'status']);
    t.index(['tenant_id', 'expense_date']);
    t.index(['tenant_id', 'category_id']);
  });
  await knex.raw(`
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_status_check CHECK (status IN ('DRAFT','POSTED','REVERSED')),
      ADD CONSTRAINT expenses_tax_treatment_check CHECK (tax_treatment IN ('STANDARD_19','REDUCED_7','KLEINUNTERNEHMER_19')),
      ADD CONSTRAINT expenses_gross_eq_net_plus_tax CHECK (gross_amount = net_amount + tax_amount),
      ADD CONSTRAINT expenses_business_pct_range CHECK (business_percentage >= 0 AND business_percentage <= 100)
  `);
  // A receipt supports at most one expense (ERD: RECEIPT ||--o| EXPENSE)
  await knex.raw(
    'CREATE UNIQUE INDEX expenses_one_per_receipt ON expenses (receipt_id) WHERE receipt_id IS NOT NULL',
  );
  await knex.raw(
    'CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('expenses');
}
