import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { getConversationInfo, type ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function GET(_: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    actor = await requireActiveUser();
    return apiSuccess(await getConversationInfo((await params).conversationId, actor), "Đã tải thông tin hội thoại");
  } catch (error) { return chatApiError(error, { actor, step: "conversation-info" }); }
}
