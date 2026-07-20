import { z } from "zod";

export const createConversationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("PROJECT"), projectId: z.string().cuid() }),
  z.object({ type: z.literal("DIRECT"), targetUserId: z.string().cuid() }),
  z.object({ type: z.literal("SUPPORT"), targetUserId: z.string().cuid() }),
]);
export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, "Tin nhắn không được để trống").max(2_000, "Tin nhắn tối đa 2.000 ký tự"),
  clientId: z.string().uuid().optional(),
});
