import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { chatMessageActionSchema } from "@/lib/validators/chat";
import { actOnMessage, type ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string; messageId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    await enforceUserMutationLimit("chat:message:action", actor.id, 60);
    const input = chatMessageActionSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Thao tác không hợp lệ", 400);
    const ids = await params;
    return apiSuccess(await actOnMessage(ids.conversationId, ids.messageId, actor, input.data.action), "Đã cập nhật tin nhắn");
  } catch (error) { return chatApiError(error, { actor, step: "message-action" }); }
}
