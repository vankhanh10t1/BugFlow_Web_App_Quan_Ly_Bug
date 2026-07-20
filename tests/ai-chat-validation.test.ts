import { describe, expect, it } from "vitest";
import { aiChatSchema } from "@/lib/validators/ai";
import { chatMessageSchema, createConversationSchema } from "@/lib/validators/chat";
import { selectChatbotModel } from "@/features/ai/model-selector";

describe("AI chat validation", () => {
  it("accepts only the three safe MVP tasks", () => {
    expect(aiChatSchema.safeParse({ task: "GUIDE", prompt: "Hướng dẫn tạo lỗi" }).success).toBe(true);
    expect(aiChatSchema.safeParse({ task: "SUMMARIZE_PROJECT", prompt: "Tóm tắt" }).success).toBe(false);
  });
  it("limits prompt length", () => {
    expect(aiChatSchema.safeParse({ task: "IMPROVE_BUG", prompt: "x".repeat(4_001) }).success).toBe(false);
  });
});

describe("Groq model selection", () => {
  const env = {
    NODE_ENV: "test",
    GROQ_DEFAULT_MODEL: "fast-model",
    GROQ_REASONING_MODEL: "reasoning-model",
  } as NodeJS.ProcessEnv;

  it("uses the default model for lightweight requests", () => {
    expect(selectChatbotModel({ task: "GUIDE", prompt: "Cách tạo bug mới?" }, env)).toEqual({ model: "fast-model", reasoning: false });
  });

  it("uses the reasoning model for analysis keywords or large context", () => {
    expect(selectChatbotModel({ task: "CLASSIFY_BUG", prompt: "Phân tích root cause và đề xuất hướng xử lý" }, env).model).toBe("reasoning-model");
    expect(selectChatbotModel({ task: "IMPROVE_BUG", prompt: "Viết lại", contextLength: 6_000 }, env).model).toBe("reasoning-model");
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
