/** §21 Client REST Contracts · §11.6 clients */
import { z } from "zod";
import { ClientStatus } from "../enums";
import {
  body,
  CountryCode,
  Email,
  IsoDateTime,
  PageQuery,
  Uuid,
  paginated,
} from "./common";

export const CreateClientRequest = body({
  name: z.string().trim().min(1).max(200),
  contactName: z.string().trim().max(200).optional().nullable(),
  email: Email.optional().nullable(),
  street: z.string().trim().max(200).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  country: CountryCode.default("DE"),
  vatId: z.string().trim().toUpperCase().max(30).optional().nullable(),
  paymentTermDays: z.number().int().min(0).max(365).optional().nullable(),
});
export type CreateClientRequest = z.infer<typeof CreateClientRequest>;

export const UpdateClientRequest = body({
  name: z.string().trim().min(1).max(200).optional(),
  contactName: z.string().trim().max(200).optional().nullable(),
  email: Email.optional().nullable(),
  street: z.string().trim().max(200).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  country: CountryCode.optional(),
  vatId: z.string().trim().toUpperCase().max(30).optional().nullable(),
  paymentTermDays: z.number().int().min(0).max(365).optional().nullable(),
});
export type UpdateClientRequest = z.infer<typeof UpdateClientRequest>;

export const ListClientsQuery = PageQuery.extend({
  search: z.string().trim().max(200).optional(),
  status: ClientStatus.optional(),
});
export type ListClientsQuery = z.infer<typeof ListClientsQuery>;

export const ClientView = z.object({
  id: Uuid,
  name: z.string(),
  contactName: z.string().nullable(),
  email: z.string().nullable(),
  street: z.string().nullable(),
  postalCode: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string(),
  vatId: z.string().nullable(),
  paymentTermDays: z.number().int().nullable(),
  status: ClientStatus,
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
  archivedAt: IsoDateTime.nullable(),
});
export type ClientView = z.infer<typeof ClientView>;

export const ClientListResponse = paginated(ClientView);
export type ClientListResponse = z.infer<typeof ClientListResponse>;
