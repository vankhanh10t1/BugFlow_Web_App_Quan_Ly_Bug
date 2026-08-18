import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { getConversationReceipts, markConversationRead, type ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";
import { publishChatEvent } from "@/features/chat/realtime";

export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    actor = await requireActiveUser();
    return apiSuccess(await getConversationReceipts((await params).conversationId, actor), "Đã tải trạng thái đọc");
  } catch (error) {
    return chatApiError(error, { actor, step: "get-conversation-receipts" });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    await enforceUserMutationLimit("chat:read", actor.id, 60);
    const { conversationId } = await params;
    const result = await markConversationRead(conversationId, actor);
    await publishChatEvent({ type: "receipt.updated", conversationId, actorId: actor.id });
    return apiSuccess(result, "Đã đánh dấu hội thoại là đã đọc");
  } catch (error) {
    return chatApiError(error, { actor, step: "mark-conversation-read" });
  }
}
