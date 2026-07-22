import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { listChatCandidates, listConversations, type ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function GET() {
  let actor: ChatActor | null = null;
  try {
    actor = await requireActiveUser();
    const [conversations, candidates] = await Promise.all([
      listConversations(actor),
      listChatCandidates(actor),
    ]);
    return apiSuccess({
      currentUser: { id: actor.id, systemRole: actor.systemRole },
      conversations,
      candidates,
    }, "Đã khởi tạo Chat");
  } catch (error) {
    return chatApiError(error, { actor, step: "initialize", event: "[chat:init] failed" });
  }
}
