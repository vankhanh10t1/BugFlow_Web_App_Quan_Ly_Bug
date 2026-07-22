import "server-only";
import { AppError } from "@/lib/errors";
import type { BugActor } from "@/features/bugs/service";
import { buildAiContext, aiSystemPrompt } from "@/features/ai/policy";
import type { AiChatInput } from "@/lib/validators/ai";
import { selectChatbotModel } from "@/features/ai/model-selector";
import { normalizeAiAnswer } from "@/features/ai/response-normalizer";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function askAi(actor: BugActor, input: AiChatInput) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new AppError("VALIDATION_ERROR", "GroqCloud chưa được cấu hình: thiếu GROQ_API_KEY.", 503);

  const maxInputTokens = positiveInt(process.env.AI_MAX_INPUT_TOKENS, 4_000);
  const context = await buildAiContext(actor, input);
  const combined = `YÊU CẦU NGƯỜI DÙNG:\n${input.prompt}\n\nCONTEXT:\n${context}`;
  if (combined.length > maxInputTokens * 4) throw new AppError("VALIDATION_ERROR", "Nội dung vượt quá giới hạn AI cho phép.", 400);
  const selection = selectChatbotModel({ task: input.task, prompt: input.prompt, contextLength: context.length });

  const timeoutMs = positiveInt(process.env.AI_REQUEST_TIMEOUT_MS, 30_000);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: selection.model,
        messages: [{ role: "system", content: aiSystemPrompt(input.task) }, { role: "user", content: combined }],
        max_tokens: 800,
        temperature: input.task === "CLASSIFY_BUG" ? 0.2 : 0.4,
      }),
      signal: controller.signal,
    });
    if (response.status === 401) throw new AppError("UNAUTHORIZED", "GROQ_API_KEY không hợp lệ.", 502);
    if (response.status === 403) throw new AppError("FORBIDDEN", "GroqCloud không cho phép tài khoản sử dụng model đã chọn.", 502);
    if (response.status === 404) throw new AppError("VALIDATION_ERROR", "Model GroqCloud không hợp lệ hoặc không còn khả dụng.", 502);
    if (response.status === 429) throw new AppError("RATE_LIMITED", "GroqCloud đang giới hạn tần suất. Vui lòng thử lại sau.", 429);
    if (response.status === 400) throw new AppError("VALIDATION_ERROR", "GroqCloud từ chối yêu cầu hoặc model đã cấu hình không phù hợp.", 502);
    if (!response.ok) throw new AppError("DATABASE_ERROR", "GroqCloud tạm thời không khả dụng.", 502);
    const body = await response.json() as { choices?: { message?: { content?: string } }[] };
    const answer = normalizeAiAnswer(body.choices?.[0]?.message?.content ?? "");
    if (!answer) throw new AppError("DATABASE_ERROR", "AI không trả về nội dung hợp lệ.", 502);
    return { answer, task: input.task, model: selection.model, reasoning: selection.reasoning };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new AppError("DATABASE_ERROR", "Yêu cầu AI đã hết thời gian chờ.", 504);
    throw new AppError("DATABASE_ERROR", "Không thể kết nối GroqCloud.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
