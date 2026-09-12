import type { Knex } from "knex";

/** §11.7 invoice_sequences · §11.8 invoices · §11.9 invoice_lines */
export async function up(knex: Knex): Promise<void> {
  // §11.7 — "Invoice number allocation SHALL execute under a row lock." (SELECT ... FOR UPDATE at finalize)
  await knex.schema.createTable("invoice_sequences", (t) => {
    t.uuid("tenant_id")
      .primary()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    t.integer("year").notNullable();
    t.integer("next_number").notNullable();
    t.timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("invoices", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    t.uuid("client_id").notNullable().references("id").inTable("clients");
    t.uuid("business_profile_version_id")
      .notNullable()
      .references("id")
      .inTable("business_profile_versions");

    t.string("status", 30).notNullable();

    t.string("invoice_number", 100).nullable();
    t.date("issue_date").nullable();
    t.date("service_date").nullable();
    t.date("due_date").nullable();
    t.specificType("currency", "char(3)").notNullable().defaultTo("EUR");

    t.decimal("subtotal_net", 15, 2).notNullable().defaultTo(0);
    t.decimal("tax_total", 15, 2).notNullable().defaultTo(0);
    t.decimal("gross_total", 15, 2).notNullable().defaultTo(0);

    t.decimal("paid_amount", 15, 2).notNullable().defaultTo(0);
    t.decimal("outstanding_amount", 15, 2).notNullable().defaultTo(0);

    t.string("client_name_snapshot", 200).nullable();
    t.string("client_street_snapshot", 200).nullable();
    t.string("client_postal_code_snapshot", 20).nullable();
    t.string("client_city_snapshot", 100).nullable();
    t.specificType("client_country_snapshot", "char(2)").nullable();
    t.string("client_vat_id_snapshot", 30).nullable();

    t.text("notes").nullable();

    t.uuid("pdf_document_id").nullable();
    t.uuid("xrechnung_document_id").nullable();

    t.timestamp("finalized_at", { useTz: true }).nullable();
    t.timestamp("cancelled_at", { useTz: true }).nullable();
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    t.unique(["tenant_id", "invoice_number"]);
    t.index(["tenant_id", "status"]);
    t.index(["tenant_id", "client_id"]);
    t.index(["tenant_id", "issue_date"]);
  });
  await knex.raw(`
    ALTER TABLE invoices
      ADD CONSTRAINT invoices_status_check CHECK (status IN ('DRAFT','FINALIZED','PARTIALLY_PAID','PAID','CANCELLED')),
      -- §11.8: invoice_number IS NULL only when status = DRAFT
      ADD CONSTRAINT invoices_number_when_not_draft CHECK (status = 'DRAFT' OR invoice_number IS NOT NULL),
      ADD CONSTRAINT invoices_currency_check CHECK (currency = 'EUR'),
      -- totals are derived and must be self-consistent
      ADD CONSTRAINT invoices_gross_eq_net_plus_tax CHECK (gross_total = subtotal_net + tax_total),
      ADD CONSTRAINT invoices_outstanding_consistent CHECK (outstanding_amount = gross_total - paid_amount),
      ADD CONSTRAINT invoices_paid_bounds CHECK (paid_amount >= 0 AND paid_amount <= gross_total)
  `);
  await knex.raw(
    "CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at()",
  );

  await knex.schema.createTable("invoice_lines", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("invoice_id")
      .notNullable()
      .references("id")
      .inTable("invoices")
      .onDelete("CASCADE");

    t.integer("position").notNullable();
    t.text("description").notNullable();

    t.decimal("quantity", 15, 4).notNullable();
    t.string("unit", 30).notNullable().defaultTo("unit");
    t.decimal("unit_price", 15, 4).notNullable();

    t.string("tax_treatment", 40).notNullable();
    t.decimal("tax_rate", 7, 4).notNullable();

    t.decimal("net_amount", 15, 2).notNullable();
    t.decimal("tax_amount", 15, 2).notNullable();
    t.decimal("gross_amount", 15, 2).notNullable();

    t.unique(["invoice_id", "position"]);
  });
  await knex.raw(`
    ALTER TABLE invoice_lines
      ADD CONSTRAINT invoice_lines_tax_treatment_check CHECK (tax_treatment IN ('STANDARD_19','REDUCED_7','KLEINUNTERNEHMER_19')),
      -- §11.9: KLEINUNTERNEHMER_19 has tax_rate = 0 and tax_amount = 0
      ADD CONSTRAINT invoice_lines_kleinunternehmer_zero CHECK (tax_treatment <> 'KLEINUNTERNEHMER_19' OR (tax_rate = 0 AND tax_amount = 0)),
      ADD CONSTRAINT invoice_lines_gross_eq_net_plus_tax CHECK (gross_amount = net_amount + tax_amount)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("invoice_lines");
  await knex.schema.dropTableIfExists("invoices");
  await knex.schema.dropTableIfExists("invoice_sequences");
}
