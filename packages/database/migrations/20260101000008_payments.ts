import type { Knex } from "knex";

/** §11.10 payments */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("payments", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    t.uuid("invoice_id").notNullable().references("id").inTable("invoices");

    t.decimal("amount", 15, 2).notNullable();
    t.date("payment_date").notNullable();
    t.string("payment_method", 30).notNullable();
    t.string("reference", 255).nullable();

    t.string("status", 20).notNullable().defaultTo("RECORDED");

    t.uuid("reversal_of").nullable().references("id").inTable("payments");
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    t.index(["tenant_id", "invoice_id"]);
    t.index(["tenant_id", "payment_date"]);
  });
  await knex.raw(`
    ALTER TABLE payments
      ADD CONSTRAINT payments_method_check CHECK (payment_method IN ('BANK_TRANSFER','CASH','OTHER')),
      ADD CONSTRAINT payments_status_check CHECK (status IN ('RECORDED','REVERSED')),
      ADD CONSTRAINT payments_amount_positive CHECK (amount > 0)
  `);
  await knex.raw(
    "CREATE UNIQUE INDEX payments_reversal_once ON payments (reversal_of) WHERE reversal_of IS NOT NULL",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("payments");
}
