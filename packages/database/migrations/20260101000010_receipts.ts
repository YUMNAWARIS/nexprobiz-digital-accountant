import type { Knex } from "knex";

/** §11.12 receipts · §11.13 ocr_runs */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("receipts", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    t.uuid("document_id").notNullable().references("id").inTable("documents");

    t.string("status", 30).notNullable();

    t.string("merchant", 200).nullable();
    t.string("receipt_number", 100).nullable();
    t.date("receipt_date").nullable();
    t.specificType("currency", "char(3)").nullable().defaultTo("EUR");

    t.decimal("net_amount", 15, 2).nullable();
    t.decimal("tax_amount", 15, 2).nullable();
    t.decimal("gross_amount", 15, 2).nullable();

    t.decimal("ocr_confidence", 5, 4).nullable();

    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    t.index(["tenant_id", "status"]);
    t.unique(["document_id"]);
  });
  await knex.raw(
    `ALTER TABLE receipts ADD CONSTRAINT receipts_status_check CHECK (status IN ('UPLOADED','OCR_PROCESSING','NEEDS_REVIEW','CONFIRMED','FAILED'))`,
  );
  await knex.raw(
    "CREATE TRIGGER receipts_updated_at BEFORE UPDATE ON receipts FOR EACH ROW EXECUTE FUNCTION set_updated_at()",
  );

  await knex.schema.createTable("ocr_runs", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    t.uuid("receipt_id")
      .notNullable()
      .references("id")
      .inTable("receipts")
      .onDelete("CASCADE");

    t.string("provider", 50).notNullable();
    t.string("model", 100).notNullable();
    t.string("status", 30).notNullable();

    t.jsonb("raw_result").nullable();
    t.string("error_code", 100).nullable();
    t.text("error_message").nullable();

    t.timestamp("started_at", { useTz: true }).nullable();
    t.timestamp("completed_at", { useTz: true }).nullable();
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    t.index(["tenant_id", "receipt_id"]);
  });
  await knex.raw(
    `ALTER TABLE ocr_runs ADD CONSTRAINT ocr_runs_status_check CHECK (status IN ('STARTED','SUCCEEDED','FAILED'))`,
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("ocr_runs");
  await knex.schema.dropTableIfExists("receipts");
}
