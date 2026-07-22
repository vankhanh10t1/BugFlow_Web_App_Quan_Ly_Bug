import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { chatReportSchema } from "@/lib/validators/chat";
import { reportConversation, type ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    await enforceUserMutationLimit("chat:report", actor.id, 5, 60 * 60_000);
    const input = chatReportSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Lý do không hợp lệ", 400);
    return apiSuccess(await reportConversation((await params).conversationId, actor, input.data.reason), "Đã ghi nhận báo xấu", 201);
  } catch (error) { return chatApiError(error, { actor, step: "report-conversation" }); }
}
