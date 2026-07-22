import { z } from "zod";

export const createConversationSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("PROJECT"), projectId: z.string().cuid() }),
  z.object({ type: z.literal("DIRECT"), targetUserId: z.string().cuid() }),
  z.object({ type: z.literal("SUPPORT"), targetUserId: z.string().cuid() }),
]);
export const chatMessageSchema = z.object({
  content: z.string().trim().max(2_000, "Tin nhắn tối đa 2.000 ký tự").default(""),
  clientId: z.string().uuid().optional(),
  type: z.enum(["TEXT", "EMOJI", "STICKER", "REMINDER"]).default("TEXT"),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).default("NORMAL"),
  sticker: z.string().trim().max(32).optional(),
  reminderAt: z.coerce.date().optional(),
}).superRefine((value, context) => {
  if (value.type === "STICKER" && !value.sticker) context.addIssue({ code: "custom", path: ["sticker"], message: "Hãy chọn sticker" });
  if (value.type !== "STICKER" && !value.content) context.addIssue({ code: "custom", path: ["content"], message: "Tin nhắn không được để trống" });
  if (value.type === "REMINDER" && (!value.reminderAt || value.reminderAt <= new Date())) context.addIssue({ code: "custom", path: ["reminderAt"], message: "Thời gian nhắc phải ở tương lai" });
});

export const chatMessageActionSchema = z.object({
  action: z.enum(["PIN", "UNPIN", "MARK", "UNMARK", "RECALL", "DELETE_FOR_ME"]),
});

export const chatBulkActionSchema = z.object({
  action: z.enum(["MARK", "UNMARK", "DELETE_FOR_ME"]),
  messageIds: z.array(z.string().cuid()).min(1).max(100),
});

export const chatSettingsSchema = z.object({
  hidden: z.boolean().optional(),
  clearHistory: z.boolean().optional(),
  autoDeleteSeconds: z.union([z.literal(0), z.number().int().min(3_600).max(30 * 24 * 3_600)]).optional(),
}).refine((value) => Object.keys(value).length > 0, "Không có thiết lập cần cập nhật");

export const chatReportSchema = z.object({ reason: z.string().trim().min(5, "Lý do báo xấu tối thiểu 5 ký tự").max(500) });
