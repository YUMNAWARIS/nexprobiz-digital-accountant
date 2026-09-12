import { z } from "zod";

export const Uuid = z.string().uuid();
export const IsoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
export const IsoDateTime = z.string().datetime({ offset: true });
export const Email = z.string().trim().toLowerCase().email().max(320);
export const CountryCode = z.string().length(2).toUpperCase();
export const Currency = z.literal("EUR"); // §4: EUR only

/**
 * SEC-003: "Never accept tenantId from frontend request bodies."
 * Every request body is built with body() so the check cannot be forgotten.
 * .strict() means an unknown key is a 400, not silently dropped.
 */
const FORBIDDEN_BODY_KEYS = [
  "tenant_id",
  "tenantId",
  "tenant",
  "user_id",
  "userId",
  "actor_user_id",
] as const;

export function body<T extends z.ZodRawShape>(shape: T) {
  const inner = z.object(shape).strict();
  // preprocess sees the RAW input, before .strict() strips unknown keys — so the
  // refusal names the offending field explicitly instead of a generic unrecognized_keys.
  return z.preprocess((raw, ctx) => {
    if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
      for (const k of FORBIDDEN_BODY_KEYS) {
        if (k in raw) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [k],
            message: `${k} is derived from the access token and must not be supplied.`,
          });
        }
      }
    }
    return raw;
  }, inner);
}

// ---- pagination (§21, §22, §27) ----------------------------------------------

export const PageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PageQuery = z.infer<typeof PageQuery>;

export const PageMeta = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});
export type PageMeta = z.infer<typeof PageMeta>;

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({ data: z.array(item), meta: PageMeta });
}
export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export const DateRangeQuery = z.object({
  dateFrom: IsoDate.optional(),
  dateTo: IsoDate.optional(),
});

export const YearQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});
export type YearQuery = z.infer<typeof YearQuery>;
