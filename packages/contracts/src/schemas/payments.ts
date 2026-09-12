/** §23 Manual Payment REST Contract · §11.10 payments */
import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "../enums";
import { MoneySchema, PositiveMoneySchema } from "../money";
import { body, IsoDate, IsoDateTime, Uuid } from "./common";

export const RecordPaymentRequest = body({
  amount: PositiveMoneySchema, // amount > 0
  paymentDate: IsoDate,
  paymentMethod: PaymentMethod,
  reference: z.string().trim().max(255).optional().nullable(),
});
export type RecordPaymentRequest = z.infer<typeof RecordPaymentRequest>;

export const PaymentView = z.object({
  id: Uuid,
  invoiceId: Uuid,
  amount: MoneySchema,
  paymentDate: IsoDate,
  paymentMethod: PaymentMethod,
  reference: z.string().nullable(),
  status: PaymentStatus,
  reversalOf: Uuid.nullable(),
  journalEntryId: Uuid.nullable(),
  createdAt: IsoDateTime,
});
export type PaymentView = z.infer<typeof PaymentView>;

export const PaymentListResponse = z.object({ data: z.array(PaymentView) });
export type PaymentListResponse = z.infer<typeof PaymentListResponse>;
