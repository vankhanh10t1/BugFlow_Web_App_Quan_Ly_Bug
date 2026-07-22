import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { chatSettingsSchema } from "@/lib/validators/chat";
import { updateConversationSettings, type ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function PATCH(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    await enforceUserMutationLimit("chat:settings", actor.id, 20);
    const input = chatSettingsSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Thiết lập không hợp lệ", 400);
    return apiSuccess(await updateConversationSettings((await params).conversationId, actor, input.data), "Đã cập nhật thiết lập hội thoại");
  } catch (error) { return chatApiError(error, { actor, step: "conversation-settings" }); }
}
