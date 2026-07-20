import { describe, expect, it } from "vitest";
import { aiChatSchema } from "@/lib/validators/ai";
import { chatMessageSchema, createConversationSchema } from "@/lib/validators/chat";

describe("AI chat validation", () => {
  it("accepts only the three safe MVP tasks", () => {
    expect(aiChatSchema.safeParse({ task: "GUIDE", prompt: "Hướng dẫn tạo lỗi" }).success).toBe(true);
    expect(aiChatSchema.safeParse({ task: "SUMMARIZE_PROJECT", prompt: "Tóm tắt" }).success).toBe(false);
  });
  it("limits prompt length", () => {
    expect(aiChatSchema.safeParse({ task: "IMPROVE_BUG", prompt: "x".repeat(4_001) }).success).toBe(false);
  });
});

describe("chat validation", () => {
  it("requires the target matching the conversation type", () => {
    expect(createConversationSchema.safeParse({ type: "PROJECT", projectId: "cm12345678901234567890123" }).success).toBe(true);
    expect(createConversationSchema.safeParse({ type: "DIRECT", projectId: "cm12345678901234567890123" }).success).toBe(false);
  });
  it("limits message content and validates idempotency key", () => {
    expect(chatMessageSchema.safeParse({ content: "Xin chào", clientId: "c2df8548-8c33-4fc6-befa-47136691b841" }).success).toBe(true);
    expect(chatMessageSchema.safeParse({ content: "x".repeat(2_001) }).success).toBe(false);
  });
});
