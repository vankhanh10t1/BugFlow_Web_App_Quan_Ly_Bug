import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { listChatCandidates } from "@/features/chat/service";
import type { ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function GET() {
  let actor: ChatActor | null = null;
  try { actor = await requireActiveUser(); return apiSuccess(await listChatCandidates(actor), "Đã tải danh sách người có thể trò chuyện"); }
  catch (error) { return chatApiError(error, { actor, step: "list-candidates" }); }
}
