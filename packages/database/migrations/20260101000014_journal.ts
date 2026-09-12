import type { Knex } from "knex";

/**
 * §11.20 journal_entries · §11.21 journal_lines
 * "Within every journal entry: SUM(DEBIT) = SUM(CREDIT). This validation is mandatory."
 * Enforced here as a DEFERRABLE INITIALLY DEFERRED constraint trigger, so the check runs
 * at COMMIT after all lines of an entry are inserted.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("journal_entries", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("tenant_id")
      .notNullable()
      .references("id")
      .inTable("tenants")
      .onDelete("CASCADE");

    t.string("source_type", 30).notNullable();
    t.uuid("source_id").notNullable();

    t.date("posting_date").notNullable();
    t.text("description").notNullable();

    t.string("status", 20).notNullable();
    t.uuid("reversal_of")
      .nullable()
      .references("id")
      .inTable("journal_entries");

    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    t.index(["tenant_id", "posting_date"]);
    t.index(["tenant_id", "source_type", "source_id"]);
    t.index(["tenant_id", "status"]);
  });
  await knex.raw(`
    ALTER TABLE journal_entries
      ADD CONSTRAINT journal_entries_source_type_check CHECK (source_type IN ('INVOICE','PAYMENT','EXPENSE')),
      ADD CONSTRAINT journal_entries_status_check CHECK (status IN ('POSTED','REVERSED'))
  `);
  // At most one reversal per entry — race-proof, unlike a SELECT-then-check.
  await knex.raw(
    "CREATE UNIQUE INDEX journal_entries_reversal_once ON journal_entries (reversal_of) WHERE reversal_of IS NOT NULL",
  );

  await knex.schema.createTable("journal_lines", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    t.uuid("journal_entry_id")
      .notNullable()
      .references("id")
      .inTable("journal_entries")
      .onDelete("CASCADE");

    t.string("account_number", 20).notNullable();
    t.string("counter_account", 20).nullable();
    t.string("category_code", 50).nullable();

    t.string("direction", 10).notNullable();

    t.decimal("amount", 15, 2).notNullable();
    t.decimal("tax_amount", 15, 2).notNullable().defaultTo(0);
    t.decimal("tax_rate", 7, 4).nullable();

    t.timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    t.index(["journal_entry_id"]);
    t.index(["account_number"]);
  });
  await knex.raw(`
    ALTER TABLE journal_lines
      ADD CONSTRAINT journal_lines_direction_check CHECK (direction IN ('DEBIT','CREDIT')),
      ADD CONSTRAINT journal_lines_amount_positive CHECK (amount > 0)
  `);

  // ---- mandatory balance validation (§11.21) ----
  await knex.raw(`
    CREATE OR REPLACE FUNCTION assert_journal_entry_balanced() RETURNS trigger AS $$
    DECLARE
      entry_id uuid;
      debit_sum numeric(15,2);
      credit_sum numeric(15,2);
      line_count integer;
    BEGIN
      entry_id := COALESCE(NEW.journal_entry_id, OLD.journal_entry_id);
      SELECT
        COALESCE(SUM(CASE WHEN direction = 'DEBIT'  THEN amount END), 0),
        COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount END), 0),
        COUNT(*)
      INTO debit_sum, credit_sum, line_count
      FROM journal_lines WHERE journal_entry_id = entry_id;

      IF line_count > 0 AND debit_sum <> credit_sum THEN
        RAISE EXCEPTION 'JOURNAL_UNBALANCED: entry % debit % <> credit %', entry_id, debit_sum, credit_sum
          USING ERRCODE = 'check_violation';
      END IF;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await knex.raw(`
    CREATE CONSTRAINT TRIGGER journal_lines_balanced
      AFTER INSERT OR UPDATE OR DELETE ON journal_lines
      DEFERRABLE INITIALLY DEFERRED
      FOR EACH ROW EXECUTE FUNCTION assert_journal_entry_balanced();
  `);

  // ---- ARCH-005: posted journal lines are immutable ----
  await knex.raw(`
    CREATE OR REPLACE FUNCTION reject_journal_line_mutation() RETURNS trigger AS $$
    BEGIN
      RAISE EXCEPTION 'JOURNAL_LINES_IMMUTABLE: journal_lines cannot be % (ARCH-005: corrections use reversals)', TG_OP
        USING ERRCODE = 'insufficient_privilege';
    END;
    $$ LANGUAGE plpgsql;
  `);
  await knex.raw(`
    CREATE TRIGGER journal_lines_immutable
      BEFORE UPDATE OR DELETE ON journal_lines
      FOR EACH ROW EXECUTE FUNCTION reject_journal_line_mutation();
  `);
  // journal_entries: the ONLY permitted update is status POSTED -> REVERSED (set when a reversal is posted).
  await knex.raw(`
    CREATE OR REPLACE FUNCTION restrict_journal_entry_update() RETURNS trigger AS $$
    BEGIN
      IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'JOURNAL_ENTRIES_IMMUTABLE: journal_entries cannot be deleted' USING ERRCODE = 'insufficient_privilege';
      END IF;
      IF NEW.id <> OLD.id OR NEW.tenant_id <> OLD.tenant_id OR NEW.source_type <> OLD.source_type
         OR NEW.source_id <> OLD.source_id OR NEW.posting_date <> OLD.posting_date
         OR NEW.description <> OLD.description OR NEW.reversal_of IS DISTINCT FROM OLD.reversal_of
         OR NEW.created_at <> OLD.created_at THEN
        RAISE EXCEPTION 'JOURNAL_ENTRIES_IMMUTABLE: only status may change (POSTED -> REVERSED)' USING ERRCODE = 'insufficient_privilege';
      END IF;
      IF NOT (OLD.status = 'POSTED' AND NEW.status = 'REVERSED') THEN
        RAISE EXCEPTION 'JOURNAL_ENTRIES_IMMUTABLE: invalid status transition % -> %', OLD.status, NEW.status USING ERRCODE = 'insufficient_privilege';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await knex.raw(`
    CREATE TRIGGER journal_entries_restrict
      BEFORE UPDATE OR DELETE ON journal_entries
      FOR EACH ROW EXECUTE FUNCTION restrict_journal_entry_update();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    "DROP TRIGGER IF EXISTS journal_entries_restrict ON journal_entries",
  );
  await knex.raw("DROP FUNCTION IF EXISTS restrict_journal_entry_update()");
  await knex.raw(
    "DROP TRIGGER IF EXISTS journal_lines_immutable ON journal_lines",
  );
  await knex.raw("DROP FUNCTION IF EXISTS reject_journal_line_mutation()");
  await knex.raw(
    "DROP TRIGGER IF EXISTS journal_lines_balanced ON journal_lines",
  );
  await knex.raw("DROP FUNCTION IF EXISTS assert_journal_entry_balanced()");
  await knex.schema.dropTableIfExists("journal_lines");
  await knex.schema.dropTableIfExists("journal_entries");
}
