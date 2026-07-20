import "server-only";
import { AppError } from "@/lib/errors";
import type { BugActor } from "@/features/bugs/service";
import { buildAiContext, aiSystemPrompt } from "@/features/ai/policy";
import type { AiChatInput } from "@/lib/validators/ai";

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function askAi(actor: BugActor, input: AiChatInput) {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!apiKey || !model) throw new AppError("VALIDATION_ERROR", "AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.", 503);
  const provider = process.env.AI_PROVIDER || "openai-compatible";
  if (provider !== "openai-compatible") throw new AppError("VALIDATION_ERROR", "AI_PROVIDER chưa được hỗ trợ.", 503);

  const maxInputTokens = positiveInt(process.env.AI_MAX_INPUT_TOKENS, 4_000);
  const context = await buildAiContext(actor, input);
  const combined = `YÊU CẦU NGƯỜI DÙNG:\n${input.prompt}\n\nCONTEXT:\n${context}`;
  if (combined.length > maxInputTokens * 4) throw new AppError("VALIDATION_ERROR", "Nội dung vượt quá giới hạn AI cho phép.", 400);

  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const timeoutMs = positiveInt(process.env.AI_REQUEST_TIMEOUT_MS, 30_000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: aiSystemPrompt(input.task) }, { role: "user", content: combined }],
        max_tokens: 800,
        temperature: input.task === "CLASSIFY_BUG" ? 0.2 : 0.4,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new AppError("DATABASE_ERROR", "Dịch vụ AI tạm thời không khả dụng.", 502);
    const body = await response.json() as { choices?: { message?: { content?: string } }[] };
    const answer = body.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new AppError("DATABASE_ERROR", "AI không trả về nội dung hợp lệ.", 502);
    return { answer, task: input.task, model };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new AppError("DATABASE_ERROR", "Yêu cầu AI đã hết thời gian chờ.", 504);
    throw new AppError("DATABASE_ERROR", "Không thể kết nối dịch vụ AI.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
