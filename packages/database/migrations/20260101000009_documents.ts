import type { Knex } from "knex";

/** §11.11 documents — metadata only; bytes live in blob storage (ARCH-003) */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("documents", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");

    t.string("type", 40).notNullable();
    t.string("blob_name", 500).notNullable();
    t.string("original_filename", 255).notNullable();
    t.string("mime_type", 100).notNullable();
    t.bigInteger("size_bytes").notNullable();
    t.specificType("sha256", "char(64)").notNullable();

    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    t.index(["tenant_id", "type"]);
    t.unique(["blob_name"]);
  });
  await knex.raw(
    `ALTER TABLE documents ADD CONSTRAINT documents_type_check CHECK (type IN ('INVOICE_PDF','XRECHNUNG_XML','RECEIPT','DATEV_EXPORT'))`,
  );

  // invoices.pdf_document_id / xrechnung_document_id are declared in 007 without FK (documents did not exist yet).
  await knex.schema.alterTable("invoices", (t) => {
    t.foreign("pdf_document_id").references("id").inTable("documents");
    t.foreign("xrechnung_document_id").references("id").inTable("documents");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("invoices", (t) => {
    t.dropForeign(["pdf_document_id"]);
    t.dropForeign(["xrechnung_document_id"]);
  });
  await knex.schema.dropTableIfExists("documents");
}
