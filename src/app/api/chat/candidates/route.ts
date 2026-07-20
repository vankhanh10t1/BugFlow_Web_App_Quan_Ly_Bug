import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { listChatCandidates } from "@/features/chat/service";

export async function GET() {
  try { return apiSuccess(await listChatCandidates(await requireActiveUser()), "Đã tải danh sách người có thể trò chuyện"); }
  catch (error) { return apiError(error); }
}
