import type { Knex } from "knex";

/** §11.15 bank_imports · §11.16 bank_transactions */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("bank_imports", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    t.string("filename", 255).notNullable();
    t.specificType("sha256", "char(64)").notNullable();

    t.integer("row_count").notNullable();
    t.integer("imported_count").notNullable();
    t.integer("duplicate_count").notNullable();
    t.integer("failed_count").notNullable();

    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.index(["tenant_id", "created_at"]);
  });

  await knex.schema.createTable("bank_transactions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    t.uuid("bank_import_id")
      .notNullable()
      .references("id")
      .inTable("bank_imports");

    // SHA256(booking_date + amount + currency + description + counterparty) — §11.16
    t.specificType("external_key", "char(64)").notNullable();

    t.date("booking_date").notNullable();
    t.date("value_date").nullable();
    t.text("description").notNullable();
    t.string("counterparty", 255).nullable();

    t.decimal("amount", 15, 2).notNullable();
    t.specificType("currency", "char(3)").notNullable().defaultTo("EUR");

    t.string("classification", 30).notNullable().defaultTo("UNREVIEWED");

    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    // §11.16 — this unique index IS the duplicate-detection mechanism (TEST-ACC-010)
    t.unique(["tenant_id", "external_key"]);
    t.index(["tenant_id", "classification"]);
    t.index(["tenant_id", "booking_date"]);
  });
  await knex.raw(
    `ALTER TABLE bank_transactions ADD CONSTRAINT bank_transactions_classification_check CHECK (classification IN ('UNREVIEWED','BUSINESS','PERSONAL','TRANSFER'))`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("bank_transactions");
  await knex.schema.dropTableIfExists("bank_imports");
}
