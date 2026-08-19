import { apiError } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceRateLimit, enforceUserMutationLimit } from "@/lib/rate-limit";
import { aiChatSchema } from "@/lib/validators/ai";
import { AppError } from "@/lib/errors";
import { prepareAiStream } from "@/features/ai/service";
import { CHANGE_START, parseSuggestion, visibleAnswer } from "@/features/ai/suggestion-format";
import { prisma } from "@/lib/prisma";
const encoder = new TextEncoder(); const line = (event: unknown) => encoder.encode(`${JSON.stringify(event)}\n`);
export async function POST(request: Request) {
  try {
    assertSameOriginRequest(request); const actor = await requireActiveUser(); const input = aiChatSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Yêu cầu AI không hợp lệ", 400);
    await enforceUserMutationLimit("ai:request", actor.id, 10); const dailyLimit = Number(process.env.AI_DAILY_USER_LIMIT ?? 50);
    await enforceRateLimit({ scope: "ai:daily", identifier: `user:${actor.id}`, limit: Number.isInteger(dailyLimit) && dailyLimit > 0 ? dailyLimit : 50, windowMs: 24 * 60 * 60_000 });
    const prepared = await prepareAiStream(actor, input.data, request.signal); const reader = prepared.response.body?.getReader();
    if (!reader) throw new AppError("DATABASE_ERROR", "GroqCloud không trả về luồng dữ liệu.", 502);
    let raw = "", providerBuffer = "", sentLength = 0, completionTokens: number | undefined;
    const stream = new ReadableStream<Uint8Array>({ async start(controller) {
      controller.enqueue(line({ type: "meta", auditId: prepared.auditId, model: prepared.model })); const decoder = new TextDecoder();
      try {
        while (true) { const { done, value } = await reader.read(); if (done) break; providerBuffer += decoder.decode(value, { stream: true }); const lines = providerBuffer.split("\n"); providerBuffer = lines.pop() ?? "";
          for (const providerLine of lines) { if (!providerLine.startsWith("data: ") || providerLine === "data: [DONE]") continue; try { const event = JSON.parse(providerLine.slice(6)) as { choices?: { delta?: { content?: string } }[]; usage?: { completion_tokens?: number } }; raw += event.choices?.[0]?.delta?.content ?? ""; completionTokens = event.usage?.completion_tokens ?? completionTokens; const marker = raw.indexOf(CHANGE_START); const safeEnd = marker >= 0 ? marker : Math.max(0, raw.length - CHANGE_START.length); if (safeEnd > sentLength) { controller.enqueue(line({ type: "delta", text: raw.slice(sentLength, safeEnd) })); sentLength = safeEnd; } } catch {} }
        }
        const answer = visibleAnswer(raw); const suggestion = parseSuggestion(raw); if (!answer) throw new Error("empty response"); if (sentLength < answer.length) controller.enqueue(line({ type: "delta", text: answer.slice(sentLength) })); const tokenEstimate = completionTokens ?? Math.ceil(raw.length / 4);
        await prisma.aIAuditLog.update({ where: { id: prepared.auditId }, data: { status: "success", latencyMs: Date.now() - prepared.startedAt, tokenEstimate } }); controller.enqueue(line({ type: "done", suggestion, latencyMs: Date.now() - prepared.startedAt, tokenEstimate })); controller.close();
      } catch { const cancelled = prepared.controller.signal.aborted; await prisma.aIAuditLog.update({ where: { id: prepared.auditId }, data: { status: cancelled ? (prepared.controller.signal.reason === "timeout" ? "error" : "cancelled") : "error", latencyMs: Date.now() - prepared.startedAt, tokenEstimate: Math.ceil(raw.length / 4) } }).catch(() => undefined); controller.enqueue(line({ type: cancelled && prepared.controller.signal.reason !== "timeout" ? "cancelled" : "error", message: prepared.controller.signal.reason === "timeout" ? "Yêu cầu AI đã hết thời gian chờ." : "Luồng AI bị gián đoạn." })); controller.close();
      } finally { clearTimeout(prepared.timeout); request.signal.removeEventListener("abort", prepared.onAbort); reader.releaseLock(); }
    }, cancel() { prepared.controller.abort("client"); void reader.cancel(); } });
    return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-cache, no-transform", "x-content-type-options": "nosniff" } });
  } catch (error) { return apiError(error); }
}
