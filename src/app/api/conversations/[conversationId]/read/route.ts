import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { markConversationRead } from "@/features/chat/service";
import type { ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    await enforceUserMutationLimit("chat:read", actor.id, 60);
    return apiSuccess(await markConversationRead((await params).conversationId, actor), "Đã đánh dấu hội thoại là đã đọc");
  } catch (error) { return chatApiError(error, { actor, step: "mark-conversation-read" }); }
}
