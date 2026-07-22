import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { getConversation } from "@/features/chat/service";
import type { ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function GET(_: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  let actor: ChatActor | null = null;
  try { actor = await requireActiveUser(); return apiSuccess(await getConversation((await params).conversationId, actor), "Đã tải hội thoại"); }
  catch (error) { return chatApiError(error, { actor, step: "get-conversation" }); }
}
