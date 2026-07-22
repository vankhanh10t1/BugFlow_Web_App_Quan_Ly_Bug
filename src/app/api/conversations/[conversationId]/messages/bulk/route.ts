import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { chatBulkActionSchema } from "@/lib/validators/chat";
import { bulkMessageAction, type ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    await enforceUserMutationLimit("chat:message:bulk", actor.id, 20);
    const input = chatBulkActionSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Thao tác hàng loạt không hợp lệ", 400);
    return apiSuccess(await bulkMessageAction((await params).conversationId, actor, input.data.messageIds, input.data.action), "Đã cập nhật các tin nhắn");
  } catch (error) { return chatApiError(error, { actor, step: "bulk-message-action" }); }
}
