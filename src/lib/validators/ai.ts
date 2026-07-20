import { z } from "zod";

export const aiChatSchema = z.object({
  task: z.enum(["GUIDE", "IMPROVE_BUG", "CLASSIFY_BUG"]),
  prompt: z.string().trim().min(2, "Vui lòng nhập nội dung").max(4_000, "Nội dung tối đa 4.000 ký tự"),
  bugId: z.string().cuid().optional(),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
