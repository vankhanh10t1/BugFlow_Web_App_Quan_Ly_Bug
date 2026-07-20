import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { createConversationSchema } from "@/lib/validators/chat";
import { AppError } from "@/lib/errors";
import { createConversation, listConversations } from "@/features/chat/service";

export async function GET() {
  try { return apiSuccess(await listConversations(await requireActiveUser()), "Đã tải hội thoại"); }
  catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireActiveUser();
    const input = createConversationSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Dữ liệu hội thoại không hợp lệ", 400);
    await enforceUserMutationLimit("chat:conversation:create", actor.id, 10);
    return apiSuccess(await createConversation(actor, input.data), "Đã mở hội thoại", 201);
  } catch (error) { return apiError(error); }
}
