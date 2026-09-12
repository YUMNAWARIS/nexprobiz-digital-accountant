import type { Knex } from "knex";

/** §11.6 clients */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("clients", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");

    t.string("name", 200).notNullable();
    t.string("contact_name", 200).nullable();
    t.string("email", 320).nullable();

    t.string("street", 200).nullable();
    t.string("postal_code", 20).nullable();
    t.string("city", 100).nullable();
    t.specificType("country", "char(2)").notNullable().defaultTo("DE");

    t.string("vat_id", 30).nullable();

    t.integer("payment_term_days").nullable();
    t.string("status", 20).notNullable().defaultTo("ACTIVE");

    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("archived_at", { useTz: true }).nullable();

    t.index(["tenant_id", "status"]);
    t.index(["tenant_id", "name"]);
  });
  await knex.raw(
    `ALTER TABLE clients ADD CONSTRAINT clients_status_check CHECK (status IN ('ACTIVE','ARCHIVED'))`,
  );
  await knex.raw(
    "CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION set_updated_at()",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("clients");
}
