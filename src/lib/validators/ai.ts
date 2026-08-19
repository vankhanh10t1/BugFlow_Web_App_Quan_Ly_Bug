import { z } from "zod";

export const aiChatSchema = z.object({
  task: z.enum(["GUIDE", "IMPROVE_BUG", "CLASSIFY_BUG"]),
  prompt: z.string().trim().min(2, "Vui lòng nhập nội dung").max(4_000, "Nội dung tối đa 4.000 ký tự"),
  bugId: z.string().cuid().optional(),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;

export const aiFeedbackSchema = z.object({ feedback: z.enum(["HELPFUL", "NOT_HELPFUL"]) });
export const aiSuggestionSchema = z.object({
  title: z.string().trim().min(5).max(200).optional(),
  description: z.string().trim().min(10).max(10_000).optional(),
  reproductionSteps: z.string().trim().max(10_000).nullable().optional(),
  expectedResult: z.string().trim().max(5_000).nullable().optional(),
  actualResult: z.string().trim().max(5_000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  severity: z.enum(["MINOR", "MAJOR", "CRITICAL", "BLOCKER"]).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Đề xuất không có thay đổi hợp lệ");
export const aiApplySchema = z.object({ auditId: z.string().cuid(), changes: aiSuggestionSchema });
export type AiSuggestion = z.infer<typeof aiSuggestionSchema>;
