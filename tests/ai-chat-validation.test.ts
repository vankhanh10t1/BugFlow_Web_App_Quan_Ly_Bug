import { describe, expect, it } from "vitest";
import { aiChatSchema } from "@/lib/validators/ai";
import { chatBulkActionSchema, chatMessageActionSchema, chatMessageSchema, chatReportSchema, chatSettingsSchema, createConversationSchema } from "@/lib/validators/chat";
import { selectChatbotModel } from "@/features/ai/model-selector";
import { cleanInlineMarkdown, parseAiAnswer } from "@/features/ai/answer-format";
import { normalizeAiAnswer } from "@/features/ai/response-normalizer";
import { renderToStaticMarkup } from "react-dom/server";
import { AiAnswer } from "@/components/ai/ai-answer";
import { createElement } from "react";

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

describe("AI answer formatting", () => {
  it("parses headings and lists without exposing list markers", () => {
    expect(parseAiAnswer("## Hướng dẫn\n1. **Đăng nhập**\n2. Tạo bug\n\n* **Tiêu đề lỗi**")).toEqual([
      { type: "heading", text: "Hướng dẫn" },
      { type: "ordered-list", items: ["**Đăng nhập**", "Tạo bug"] },
      { type: "unordered-list", items: ["**Tiêu đề lỗi**"] },
    ]);
    expect(cleanInlineMarkdown("**Tiêu đề lỗi**")).toBe("Tiêu đề lỗi");
  });

  it("localizes known accidental German labels", () => {
    expect(normalizeAiAnswer("1. Beschreiben: lỗi đăng nhập\n* Erwartetes Ergebnis: mở dashboard")).toBe("1. Mô tả: lỗi đăng nhập\n* Kết quả mong đợi: mở dashboard");
  });

  it("renders safe semantic markup without raw Markdown", () => {
    const html = renderToStaticMarkup(createElement(AiAnswer, { answer: '1. **Đăng nhập**\n* <script>alert("xss")</script>' }));
    expect(html).toContain("<ol");
    expect(html).toContain("<ul");
    expect(html).toContain("<strong");
    expect(html).not.toContain("**");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
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
  it("validates advanced messages, actions, and per-user settings", () => {
    expect(chatMessageSchema.safeParse({ type: "STICKER", sticker: "👍", content: "", priority: "IMPORTANT" }).success).toBe(true);
    expect(chatMessageSchema.safeParse({ type: "REMINDER", content: "Họp dự án", reminderAt: "2026-07-23T02:00:00.000Z" }).success).toBe(true);
    expect(chatMessageSchema.safeParse({ type: "REMINDER", content: "Họp dự án" }).success).toBe(false);
    expect(chatMessageActionSchema.safeParse({ action: "RECALL" }).success).toBe(true);
    expect(chatBulkActionSchema.safeParse({ action: "DELETE_FOR_ME", messageIds: ["cm12345678901234567890123"] }).success).toBe(true);
    expect(chatSettingsSchema.safeParse({ autoDeleteSeconds: 3_600, hidden: true }).success).toBe(true);
    expect(chatSettingsSchema.safeParse({ autoDeleteSeconds: 30 }).success).toBe(false);
    expect(chatReportSchema.safeParse({ reason: "Nội dung có dấu hiệu quấy rối" }).success).toBe(true);
  });
});
