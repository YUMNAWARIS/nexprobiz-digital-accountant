/**
 * SEC-003 — "Never accept tenantId from frontend request bodies."
 * Walk every exported request schema and prove each rejects tenant_id / tenantId.
 */
import { z } from "zod";
import * as schemas from "../schemas";

const REQUEST_SCHEMA_NAMES = Object.keys(schemas).filter(
  (k) => /Request$/.test(k) || /Input$/.test(k),
);

describe("every request schema rejects tenant identifiers (SEC-003)", () => {
  it("finds request schemas", () => {
    expect(REQUEST_SCHEMA_NAMES.length).toBeGreaterThan(10);
  });

  for (const name of REQUEST_SCHEMA_NAMES) {
    const schema = (schemas as Record<string, unknown>)[name];
    if (!(schema instanceof z.ZodType)) continue;

    for (const key of ["tenant_id", "tenantId"] as const) {
      it(`${name} rejects ${key}`, () => {
        const r = schema.safeParse({
          [key]: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        });
        expect(r.success).toBe(false);
        if (!r.success) {
          // Either .strict() flagged it as an unrecognized key, or the superRefine named it.
          const flagged = r.error.issues.some(
            (i) =>
              (i.code === "unrecognized_keys" && i.keys.includes(key)) ||
              i.path.includes(key),
          );
          expect(flagged).toBe(true);
        }
      });
    }
  }
});

describe("the tenant refinement names the field on an otherwise-valid body", () => {
  it("CreateClientRequest + tenant_id → custom issue at path tenant_id", () => {
    const r = schemas.CreateClientRequest.safeParse({
      name: "Example GmbH",
      tenant_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const custom = r.error.issues.find(
        (i) => i.code === "custom" && i.path[0] === "tenant_id",
      );
      expect(custom?.message).toMatch(/derived from the access token/);
    }
  });
});

describe("strict bodies reject unknown keys", () => {
  it("a typo cannot be silently dropped", () => {
    const r = schemas.CreateClientRequest.safeParse({
      name: "X",
      nmae: "typo",
    });
    expect(r.success).toBe(false);
  });
});

describe("invoice line input carries no client-computed totals (ARCH-004)", () => {
  it("rejects netAmount/taxAmount/grossAmount on a line", () => {
    const r = schemas.CreateInvoiceRequest.safeParse({
      clientId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      lines: [
        {
          description: "x",
          quantity: "1",
          unitPrice: "100",
          taxTreatment: "STANDARD_19",
          netAmount: "100.00",
          taxAmount: "19.00",
          grossAmount: "119.00",
        },
      ],
    });
    expect(r.success).toBe(false);
  });
});

describe("bank CSV contract (§26)", () => {
  it("header line is exact", () => {
    expect(schemas.BANK_CSV_HEADER_LINE).toBe(
      "booking_date,value_date,description,counterparty,amount,currency",
    );
  });
  it("parses the spec example rows", () => {
    expect(
      schemas.BankCsvRow.parse({
        booking_date: "2026-09-01",
        value_date: "2026-09-01",
        description: "Adobe Subscription",
        counterparty: "Adobe",
        amount: "-59.50",
        currency: "EUR",
      }),
    ).toMatchObject({ amount: "-59.50", counterparty: "Adobe" });
  });
});
