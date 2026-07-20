import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { markConversationRead } from "@/features/chat/service";

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireActiveUser();
    await enforceUserMutationLimit("chat:read", actor.id, 60);
    return apiSuccess(await markConversationRead((await params).conversationId, actor), "Đã đánh dấu hội thoại là đã đọc");
  } catch (error) { return apiError(error); }
}
