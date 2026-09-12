/** §32 DATEV API · §33 DATEV Sandbox Implementation · §11.24 exports */
import { z } from 'zod';
import { ExportStatus, ExportType } from '../enums';
import { body, IsoDate, IsoDateTime, Uuid } from './common';

export const CreateDatevExportRequest = body({
  periodStart: IsoDate,
  periodEnd: IsoDate,
  beraternummer: z
    .string()
    .trim()
    .regex(/^\d{4,7}$/, 'Beraternummer must be 4–7 digits'),
  mandantennummer: z
    .string()
    .trim()
    .regex(/^\d{1,5}$/, 'Mandantennummer must be 1–5 digits'),
}).refine((v) => v.periodStart <= v.periodEnd, {
  path: ['periodEnd'],
  message: 'periodEnd must not be before periodStart',
});
export type CreateDatevExportRequest = z.infer<typeof CreateDatevExportRequest>;

export const DatevExportResponse = z.object({
  id: Uuid,
  status: ExportStatus,
  downloadUrl: z.string(),
});
export type DatevExportResponse = z.infer<typeof DatevExportResponse>;

export const ExportView = z.object({
  id: Uuid,
  type: ExportType,
  status: ExportStatus,
  periodStart: IsoDate,
  periodEnd: IsoDate,
  documentId: Uuid.nullable(),
  formatVersion: z.string().nullable(),
  createdAt: IsoDateTime,
  completedAt: IsoDateTime.nullable(),
});
export type ExportView = z.infer<typeof ExportView>;
export const ExportListResponse = z.object({ data: z.array(ExportView) });
export type ExportListResponse = z.infer<typeof ExportListResponse>;

/** §33 — the header/format version is represented through this. */
export interface DatevFormatDefinition {
  formatVersion: string;
  dataCategory: string;
}
