import "server-only";
import { AppError } from "@/lib/errors";
import type { BugActor } from "@/features/bugs/service";
import { buildAiContext, aiSystemPrompt } from "@/features/ai/policy";
import type { AiChatInput, AiSuggestion } from "@/lib/validators/ai";
import { selectChatbotModel } from "@/features/ai/model-selector";
import { prisma } from "@/lib/prisma";
import { canManageProject } from "@/lib/permissions";
import { getBugAccessContext } from "@/features/bugs/service";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
import { CHANGE_END, CHANGE_START } from "@/features/ai/suggestion-format";
const positiveInt = (value: string | undefined, fallback: number) => { const parsed = Number(value); return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback; };
function providerError(status: number) {
  if (status === 401) return new AppError("UNAUTHORIZED", "GROQ_API_KEY không hợp lệ.", 502);
  if (status === 403) return new AppError("FORBIDDEN", "GroqCloud không cho phép sử dụng model đã chọn.", 502);
  if (status === 404 || status === 400) return new AppError("VALIDATION_ERROR", "Model hoặc yêu cầu GroqCloud không hợp lệ.", 502);
  if (status === 429) return new AppError("RATE_LIMITED", "GroqCloud đang giới hạn tần suất. Vui lòng thử lại sau.", 429);
  return new AppError("DATABASE_ERROR", "GroqCloud tạm thời không khả dụng.", 502);
}

export async function prepareAiStream(actor: BugActor, input: AiChatInput, clientSignal: AbortSignal) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new AppError("VALIDATION_ERROR", "GroqCloud chưa được cấu hình: thiếu GROQ_API_KEY.", 503);
  const context = await buildAiContext(actor, input);
  const combined = `YÊU CẦU NGƯỜI DÙNG:\n${input.prompt}\n\nCONTEXT:\n${context}`;
  if (combined.length > positiveInt(process.env.AI_MAX_INPUT_TOKENS, 4_000) * 4) throw new AppError("VALIDATION_ERROR", "Nội dung vượt quá giới hạn AI cho phép.", 400);
  const selection = selectChatbotModel({ task: input.task, prompt: input.prompt, contextLength: context.length });
  const startedAt = Date.now();
  const audit = await prisma.aIAuditLog.create({ data: { userId: actor.id, task: input.task, model: selection.model, status: "processing", targetType: input.bugId ? "bug" : "general", targetId: input.bugId } });
  const controller = new AbortController();
  const onAbort = () => controller.abort("client");
  clientSignal.addEventListener("abort", onAbort, { once: true });
  const timeout = setTimeout(() => controller.abort("timeout"), positiveInt(process.env.AI_REQUEST_TIMEOUT_MS, 30_000));
  const system = aiSystemPrompt(input.task) + (input.task === "IMPROVE_BUG" && input.bugId ? `\nCuối câu trả lời, thêm đúng một khối ${CHANGE_START}{"field":"value"}${CHANGE_END}. JSON chỉ chứa field thay đổi trong: title, description, reproductionSteps, expectedResult, actualResult, priority, severity. Không đặt khối trong Markdown.` : "");
  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model: selection.model, messages: [{ role: "system", content: system }, { role: "user", content: combined }], max_tokens: 800, temperature: input.task === "CLASSIFY_BUG" ? 0.2 : 0.4, stream: true, stream_options: { include_usage: true } }), signal: controller.signal });
    if (!response.ok) throw providerError(response.status);
    return { response, auditId: audit.id, model: selection.model, startedAt, controller, timeout, onAbort };
  } catch (error) {
    clearTimeout(timeout); clientSignal.removeEventListener("abort", onAbort);
    await prisma.aIAuditLog.update({ where: { id: audit.id }, data: { status: controller.signal.aborted ? (controller.signal.reason === "timeout" ? "error" : "cancelled") : "error", latencyMs: Date.now() - startedAt } });
    if (error instanceof AppError) throw error;
    if (controller.signal.reason === "timeout") throw new AppError("DATABASE_ERROR", "Yêu cầu AI đã hết thời gian chờ.", 504);
    throw new AppError("DATABASE_ERROR", "Không thể kết nối GroqCloud.", 502);
  }
}

export async function applyAiSuggestion(actor: BugActor, auditId: string, changes: AiSuggestion) {
  const audit = await prisma.aIAuditLog.findFirst({ where: { id: auditId, userId: actor.id }, select: { id: true, task: true, targetId: true } });
  if (!audit || audit.task !== "IMPROVE_BUG" || !audit.targetId) throw new AppError("FORBIDDEN", "Đề xuất AI không thuộc quyền của bạn.", 403);
  const access = await getBugAccessContext(audit.targetId, actor);
  if (!canManageProject(actor.systemRole, access.role) && !(access.bug.reporterId === actor.id && access.bug.status === "NEW")) throw new AppError("FORBIDDEN", "Bạn không có quyền sửa bug này.", 403);
  try {
    const bug = await prisma.$transaction(async (tx) => {
      const updated = await tx.bug.update({ where: { id: audit.targetId! }, data: changes });
      await tx.activityLog.create({ data: { projectId: access.bug.projectId, bugId: audit.targetId!, actorId: actor.id, actionType: "BUG_UPDATED", description: `Applied confirmed AI suggestion to ${updated.bugCode}`, metadata: { auditId, fields: Object.keys(changes) } } });
      await tx.aIAuditLog.update({ where: { id: auditId }, data: { applyStatus: "applied" } }); return updated;
    });
    return { id: bug.id, updatedAt: bug.updatedAt };
  } catch (error) { await prisma.aIAuditLog.update({ where: { id: auditId }, data: { applyStatus: "failed" } }).catch(() => undefined); throw error; }
}
