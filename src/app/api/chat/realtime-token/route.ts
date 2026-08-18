import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { chatApiError } from "@/features/chat/api-error";
import { getConversation, type ChatActor } from "@/features/chat/service";
import { createChatTokenRequest } from "@/features/chat/realtime";

export async function GET(request: Request) {
  let actor: ChatActor | null = null;
  try {
    actor = await requireActiveUser();
    const conversationId = new URL(request.url).searchParams.get("conversationId");
    if (!conversationId) throw new AppError("VALIDATION_ERROR", "Thiếu hội thoại", 400);
    await getConversation(conversationId, actor);
    const token = await createChatTokenRequest(conversationId, actor.id);
    if (!token) throw new AppError("VALIDATION_ERROR", "Realtime chưa được cấu hình", 503);
    return apiSuccess(token, "Đã cấp token realtime");
  } catch (error) {
    return chatApiError(error, { actor, step: "realtime-token" });
  }
}
