import { z } from "zod";

export const DOCUMENT_TYPES = ["README", "TEST_PLAN", "API_NOTES", "CODING_CONVENTION", "RUNBOOK", "OTHER"] as const;
export const documentInputSchema = z.object({
  title: z.string().trim().min(2, "Tiêu đề phải có ít nhất 2 ký tự").max(160),
  content: z.string().max(200_000, "Nội dung tối đa 200.000 ký tự"),
  type: z.enum(DOCUMENT_TYPES).default("OTHER"),
});
export const documentUpdateSchema = documentInputSchema.extend({ updatedAt: z.iso.datetime() });
export const documentQuerySchema = z.object({
  search: z.string().trim().max(100).optional(), type: z.enum(DOCUMENT_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type DocumentInput = z.infer<typeof documentInputSchema>;
export type DocumentQuery = z.infer<typeof documentQuerySchema>;
