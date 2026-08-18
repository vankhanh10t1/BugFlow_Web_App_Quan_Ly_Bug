import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { chatMessageSchema } from "@/lib/validators/chat";
import { AppError } from "@/lib/errors";
import { getVisibleMessage, listMessages, sendMessage } from "@/features/chat/service";
import type { ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";
import { publishChatEvent } from "@/features/chat/realtime";

type Context = { params: Promise<{ conversationId: string }> };

export async function GET(request: Request, { params }: Context) {
  let actor: ChatActor | null = null;
  try {
    const url = new URL(request.url);
    const afterRaw = url.searchParams.get("after");
    const afterAsDate = afterRaw ? new Date(afterRaw) : undefined;
    const afterIsDate = Boolean(afterAsDate && !Number.isNaN(afterAsDate.getTime()));
    const after = afterIsDate ? afterAsDate : undefined;
    const afterId = url.searchParams.get("afterId") || (afterRaw && !afterIsDate ? afterRaw : undefined);
    const limit = Number(url.searchParams.get("limit") || 30);
    actor = await requireActiveUser();
    const messageId = url.searchParams.get("messageId");
    if (messageId) return apiSuccess(await getVisibleMessage((await params).conversationId, messageId, actor), "Đã tải trạng thái tin nhắn");
    return apiSuccess(await listMessages((await params).conversationId, actor, {
      cursor: url.searchParams.get("cursor") || undefined,
      after,
      afterId,
      limit,
    }), "Đã tải tin nhắn");
  } catch (error) {
    return chatApiError(error, { actor, step: "list-messages" });
  }
}

export async function POST(request: Request, { params }: Context) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    const input = chatMessageSchema.safeParse(await request.json());
    if (!input.success) {
      throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Tin nhắn không hợp lệ", 400);
    }
    await enforceUserMutationLimit("chat:message:send", actor.id, 30);
    const { conversationId } = await params;
    const message = await sendMessage(conversationId, actor, input.data);
    await publishChatEvent({ type: "message.created", conversationId, messageId: message.id, actorId: actor.id });
    return apiSuccess(message, "Đã gửi tin nhắn", 201);
  } catch (error) {
    return chatApiError(error, { actor, step: "send-message" });
  }
}
