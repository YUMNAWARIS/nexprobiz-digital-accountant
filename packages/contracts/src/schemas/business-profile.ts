/** §20 Business REST Contracts · §11.5 business_profile_versions */
import { z } from "zod";
import {
  BusinessType,
  ChartOfAccounts,
  VatRegime,
  VatTaxationMethod,
} from "../enums";
import { body, CountryCode, Email, IsoDateTime } from "./common";

export const Address = z.object({
  street: z.string().trim().min(1).max(200),
  postalCode: z.string().trim().min(1).max(20),
  city: z.string().trim().min(1).max(100),
  country: CountryCode.default("DE"),
});
export type Address = z.infer<typeof Address>;

const Iban = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/, "Invalid IBAN")
  .max(34);
const Bic = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid BIC")
  .max(11);

export const BusinessProfileInput = body({
  legalName: z.string().trim().min(1).max(200),
  businessName: z.string().trim().max(200).optional().nullable(),
  businessType: BusinessType,
  address: Address,
  email: Email.optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  taxNumber: z.string().trim().max(50).optional().nullable(),
  vatId: z.string().trim().toUpperCase().max(30).optional().nullable(),
  vatRegime: VatRegime,
  vatTaxationMethod: VatTaxationMethod.optional().nullable(),
  chartOfAccounts: ChartOfAccounts,
  invoicePrefix: z.string().trim().max(20).default(""),
  paymentTermDays: z.number().int().min(0).max(365).default(14),
  iban: Iban.optional().nullable(),
  bic: Bic.optional().nullable(),
  bankName: z.string().trim().max(100).optional().nullable(),
}).superRefine((v, ctx) => {
  // REGULAR VAT requires a taxation method; Kleinunternehmer has none.
  if (v.vatRegime === "REGULAR" && !v.vatTaxationMethod) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["vatTaxationMethod"],
      message: "Ist-/Soll-Versteuerung is required for regular VAT.",
    });
  }
});
export type BusinessProfileInput = z.infer<typeof BusinessProfileInput>;

export const BusinessProfileView = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
  legalName: z.string(),
  businessName: z.string().nullable(),
  businessType: BusinessType,
  address: Address,
  email: z.string().nullable(),
  phone: z.string().nullable(),
  taxNumber: z.string().nullable(),
  vatId: z.string().nullable(),
  vatRegime: VatRegime,
  vatTaxationMethod: VatTaxationMethod.nullable(),
  chartOfAccounts: ChartOfAccounts,
  invoicePrefix: z.string(),
  paymentTermDays: z.number().int(),
  iban: z.string().nullable(),
  bic: z.string().nullable(),
  bankName: z.string().nullable(),
  effectiveFrom: IsoDateTime,
  effectiveTo: IsoDateTime.nullable(),
  createdAt: IsoDateTime,
});
export type BusinessProfileView = z.infer<typeof BusinessProfileView>;
