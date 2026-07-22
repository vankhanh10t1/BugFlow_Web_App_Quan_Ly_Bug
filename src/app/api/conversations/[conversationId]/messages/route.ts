import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { chatMessageSchema } from "@/lib/validators/chat";
import { AppError } from "@/lib/errors";
import { listMessages, sendMessage } from "@/features/chat/service";
import type { ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

type Context = { params: Promise<{ conversationId: string }> };
export async function GET(request: Request, { params }: Context) {
  let actor: ChatActor | null = null;
  try {
    const url = new URL(request.url);
    const afterRaw = url.searchParams.get("after");
    const after = afterRaw ? new Date(afterRaw) : undefined;
    if (after && Number.isNaN(after.getTime())) throw new AppError("VALIDATION_ERROR", "Mốc thời gian không hợp lệ", 400);
    const limit = Number(url.searchParams.get("limit") || 30);
    actor = await requireActiveUser();
    return apiSuccess(await listMessages((await params).conversationId, actor, { cursor: url.searchParams.get("cursor") || undefined, after, limit }), "Đã tải tin nhắn");
  } catch (error) { return chatApiError(error, { actor, step: "list-messages" }); }
}
export async function POST(request: Request, { params }: Context) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    const input = chatMessageSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Tin nhắn không hợp lệ", 400);
    await enforceUserMutationLimit("chat:message:send", actor.id, 30);
    return apiSuccess(await sendMessage((await params).conversationId, actor, input.data.content, input.data.clientId), "Đã gửi tin nhắn", 201);
  } catch (error) { return chatApiError(error, { actor, step: "send-message" }); }
}
