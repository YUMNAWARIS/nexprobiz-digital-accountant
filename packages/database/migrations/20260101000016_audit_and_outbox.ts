import type { Knex } from "knex";

/**
 * §11.25 audit_events — "Database migration SHALL create a trigger rejecting UPDATE / DELETE."
 * §11.26 outbox_events — written in the same transaction as the domain change (§36).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("audit_events", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");
    t.uuid("actor_user_id").nullable().references("id").inTable("users");

    t.string("event_type", 100).notNullable();
    t.string("entity_type", 50).notNullable();
    t.uuid("entity_id").notNullable();

    t.jsonb("metadata").nullable();

    t.uuid("request_id").nullable();
    t.timestamp("occurred_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    t.index(["tenant_id", "occurred_at"]);
    t.index(["tenant_id", "entity_type", "entity_id"]);
    t.index(["tenant_id", "event_type"]);
  });

  await knex.raw(`
    CREATE OR REPLACE FUNCTION reject_audit_mutation() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'AUDIT_EVENTS_APPEND_ONLY: % on audit_events is not permitted', TG_OP
        USING ERRCODE = 'insufficient_privilege';
    END;
    $$ LANGUAGE plpgsql;
  `);
  await knex.raw(`
    CREATE TRIGGER audit_events_append_only
      BEFORE UPDATE OR DELETE ON audit_events
      FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
  `);
  // Also block statement-level TRUNCATE.
  await knex.raw(`
    CREATE TRIGGER audit_events_no_truncate
      BEFORE TRUNCATE ON audit_events
      FOR EACH STATEMENT EXECUTE FUNCTION reject_audit_mutation();
  `);

  await knex.schema.createTable("outbox_events", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id").nullable();
    t.string("event_type", 100).notNullable();
    t.integer("event_version").notNullable();
    t.string("aggregate_type", 50).notNullable();
    t.uuid("aggregate_id").notNullable();
    t.jsonb("payload").notNullable();

    t.timestamp("occurred_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());
    t.timestamp("published_at", { useTz: true }).nullable();
    t.integer("attempt_count").notNullable().defaultTo(0);

    t.index(["occurred_at"]);
  });
  // Dispatcher scans only unpublished rows.
  await knex.raw(
    "CREATE INDEX outbox_events_unpublished ON outbox_events (occurred_at) WHERE published_at IS NULL",
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("outbox_events");
  await knex.raw(
    "DROP TRIGGER IF EXISTS audit_events_no_truncate ON audit_events",
  );
  await knex.raw(
    "DROP TRIGGER IF EXISTS audit_events_append_only ON audit_events",
  );
  await knex.raw("DROP FUNCTION IF EXISTS reject_audit_mutation()");
  await knex.schema.dropTableIfExists("audit_events");
}
