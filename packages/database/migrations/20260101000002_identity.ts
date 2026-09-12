import type { Knex } from "knex";

/** §11.1 users · §11.2 sessions · §11.3 tenants · §11.4 tenant_memberships */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.string("email", 320).notNullable().unique();
    t.text("password_hash").notNullable();
    t.string("status", 20).notNullable().defaultTo("ACTIVE");
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });
  await knex.raw(
    "CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at()",
  );

  await knex.schema.createTable("sessions", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.text("refresh_token_hash").notNullable();
    t.timestamp("expires_at", { useTz: true }).notNullable();
    t.timestamp("revoked_at", { useTz: true }).nullable();
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.index(["user_id"]);
    t.index(["expires_at"]);
  });

  await knex.schema.createTable("tenants", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.string("name", 200).notNullable();
    t.string("status", 20).notNullable().defaultTo("ACTIVE");
    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("tenant_memberships", (t) => {
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    t.uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    t.string("role", 20).notNullable().defaultTo("OWNER");
    t.primary(["tenant_id", "user_id"]);
    t.index(["user_id"]);
  });
  // "Only OWNER is permitted in sandbox."
  await knex.raw(
    `ALTER TABLE tenant_memberships ADD CONSTRAINT tenant_memberships_role_check CHECK (role = 'OWNER')`,
  );
  // one user = one tenant (§9.2 sandbox rule)
  await knex.raw(
    "CREATE UNIQUE INDEX tenant_memberships_one_tenant_per_user ON tenant_memberships (user_id)",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tenant_memberships");
  await knex.schema.dropTableIfExists("tenants");
  await knex.schema.dropTableIfExists("sessions");
  await knex.schema.dropTableIfExists("users");
}
