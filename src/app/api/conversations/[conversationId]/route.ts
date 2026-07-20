import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { getConversation } from "@/features/chat/service";

export async function GET(_: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try { return apiSuccess(await getConversation((await params).conversationId, await requireActiveUser()), "Đã tải hội thoại"); }
  catch (error) { return apiError(error); }
}
