import type { Knex } from "knex";

/** §11.24 exports */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("exports", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    t.string("type", 30).notNullable();
    t.string("status", 30).notNullable();

    t.date("period_start").notNullable();
    t.date("period_end").notNullable();

    t.uuid("document_id").nullable().references("id").inTable("documents");
    t.string("format_version", 50).nullable();

    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("completed_at", { useTz: true }).nullable();

    t.index(["tenant_id", "created_at"]);
  });
  await knex.raw(`
    ALTER TABLE exports
      ADD CONSTRAINT exports_type_check CHECK (type IN ('DATEV_BOOKINGS')),
      ADD CONSTRAINT exports_status_check CHECK (status IN ('PENDING','COMPLETED','FAILED')),
      ADD CONSTRAINT exports_period_check CHECK (period_start <= period_end)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("exports");
}
