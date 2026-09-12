import type { Knex } from "knex";

/**
 * §11.22 / §11.23 / Story 3.3 — the 2026 DE tax rule set.
 * Rates are stored as NUMERIC-style strings so the application never sees a float.
 * Story 3.3: "No VAT rate literal is allowed in InvoiceService." — this seed is the one place 0.19 / 0.07 exist.
 */
export const TAX_RULE_SET = {
  jurisdiction: "DE",
  tax_year: 2026,
  version: 1,
  active: true,
};

export const TAX_RULE_VALUES: Array<{ rule_key: string; value_json: unknown }> =
  [
    {
      rule_key: "VAT_STANDARD_RATE",
      value_json: { rate: "0.1900", label: "19 %", treatment: "STANDARD_19" },
    },
    {
      rule_key: "VAT_REDUCED_RATE",
      value_json: { rate: "0.0700", label: "7 %", treatment: "REDUCED_7" },
    },
    // §19 UStG thresholds (EUR). Sandbox metadata only — the sandbox never evaluates eligibility.
    {
      rule_key: "KLEINUNTERNEHMER_PREVIOUS_YEAR_LIMIT",
      value_json: { amount: "25000.00", currency: "EUR" },
    },
    {
      rule_key: "KLEINUNTERNEHMER_CURRENT_YEAR_LIMIT",
      value_json: { amount: "100000.00", currency: "EUR" },
    },
  ];

export async function seed(knex: Knex): Promise<void> {
  const [set] = await knex("tax_rule_sets")
    .insert(TAX_RULE_SET)
    .onConflict(["jurisdiction", "tax_year", "version"])
    .merge(["active"])
    .returning<{ id: string }[]>("id");
  if (!set) throw new Error("[seed] tax_rule_sets upsert returned no row");

  await knex("tax_rule_values")
    .insert(
      TAX_RULE_VALUES.map((v) => ({
        rule_set_id: set.id,
        rule_key: v.rule_key,
        value_json: JSON.stringify(v.value_json),
      })),
    )
    .onConflict(["rule_set_id", "rule_key"])
    .merge(["value_json"]);
  console.log(
    `[seed] tax_rule_sets DE/${TAX_RULE_SET.tax_year}/v${TAX_RULE_SET.version} + ${TAX_RULE_VALUES.length} values upserted`,
  );
}
