import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { createConversationSchema } from "@/lib/validators/chat";
import { AppError } from "@/lib/errors";
import { createConversation, listConversations } from "@/features/chat/service";
import type { ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function GET() {
  let actor: ChatActor | null = null;
  try { actor = await requireActiveUser(); return apiSuccess(await listConversations(actor), "Đã tải hội thoại"); }
  catch (error) { return chatApiError(error, { actor, step: "list-conversations" }); }
}

export async function POST(request: Request) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    const input = createConversationSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Dữ liệu hội thoại không hợp lệ", 400);
    await enforceUserMutationLimit("chat:conversation:create", actor.id, 10);
    return apiSuccess(await createConversation(actor, input.data), "Đã mở hội thoại", 201);
  } catch (error) { return chatApiError(error, { actor, step: "create-conversation" }); }
}
