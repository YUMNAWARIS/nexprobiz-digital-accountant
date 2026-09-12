/** §25 Expense REST Contracts · §11.14 expenses · §15 state machine */
import { z } from "zod";
import { ExpenseStatus, TaxTreatment } from "../enums";
import { MoneySchema, NonNegativeMoneySchema, PercentSchema } from "../money";
import {
  body,
  DateRangeQuery,
  IsoDate,
  IsoDateTime,
  PageQuery,
  Uuid,
  paginated,
} from "./common";

export const CreateExpenseRequest = body({
  receiptId: Uuid.optional().nullable(),
  merchant: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  expenseDate: IsoDate,
  paymentDate: IsoDate.optional().nullable(),
  categoryId: Uuid,
  taxTreatment: TaxTreatment,
  netAmount: NonNegativeMoneySchema,
  taxAmount: NonNegativeMoneySchema,
  grossAmount: NonNegativeMoneySchema,
  businessPercentage: PercentSchema.default("100.00"),
});
export type CreateExpenseRequest = z.infer<typeof CreateExpenseRequest>;

export const UpdateExpenseRequest = body({
  receiptId: Uuid.optional().nullable(),
  merchant: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  expenseDate: IsoDate.optional(),
  paymentDate: IsoDate.optional().nullable(),
  categoryId: Uuid.optional(),
  taxTreatment: TaxTreatment.optional(),
  netAmount: NonNegativeMoneySchema.optional(),
  taxAmount: NonNegativeMoneySchema.optional(),
  grossAmount: NonNegativeMoneySchema.optional(),
  businessPercentage: PercentSchema.optional(),
});
export type UpdateExpenseRequest = z.infer<typeof UpdateExpenseRequest>;

export const PostExpenseRequest = body({});
export const ReverseExpenseRequest = body({
  reason: z.string().trim().min(1).max(1000),
});
export type ReverseExpenseRequest = z.infer<typeof ReverseExpenseRequest>;

export const ListExpensesQuery = PageQuery.merge(DateRangeQuery).extend({
  status: ExpenseStatus.optional(),
  categoryId: Uuid.optional(),
  search: z.string().trim().max(200).optional(),
});
export type ListExpensesQuery = z.infer<typeof ListExpensesQuery>;

export const ExpenseView = z.object({
  id: Uuid,
  receiptId: Uuid.nullable(),
  status: ExpenseStatus,
  merchant: z.string(),
  description: z.string().nullable(),
  expenseDate: IsoDate,
  paymentDate: IsoDate.nullable(),
  categoryId: Uuid,
  categoryCode: z.string(),
  categoryName: z.string(),
  taxTreatment: TaxTreatment,
  netAmount: MoneySchema,
  taxAmount: MoneySchema,
  grossAmount: MoneySchema,
  businessPercentage: z.string(),
  journalEntryId: Uuid.nullable(),
  postedAt: IsoDateTime.nullable(),
  reversedAt: IsoDateTime.nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});
export type ExpenseView = z.infer<typeof ExpenseView>;

export const ExpenseListResponse = paginated(ExpenseView);
export type ExpenseListResponse = z.infer<typeof ExpenseListResponse>;

/** §11.18 — exposed so the expense form can populate its category select. */
export const AccountCategoryView = z.object({
  id: Uuid,
  code: z.string(),
  nameDe: z.string(),
  nameEn: z.string(),
  type: z.enum(["REVENUE", "EXPENSE"]),
  active: z.boolean(),
});
export type AccountCategoryView = z.infer<typeof AccountCategoryView>;
export const AccountCategoryListResponse = z.object({
  data: z.array(AccountCategoryView),
});
export type AccountCategoryListResponse = z.infer<
  typeof AccountCategoryListResponse
>;
