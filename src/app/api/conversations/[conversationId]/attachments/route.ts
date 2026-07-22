import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import { sendChatAttachment, type ChatActor } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    await enforceUserMutationLimit("chat:attachment:send", actor.id, 10);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new AppError("VALIDATION_ERROR", "Hãy chọn tệp cần gửi", 400);
    const priorityRaw = form.get("priority");
    const priority = priorityRaw === "IMPORTANT" || priorityRaw === "URGENT" ? priorityRaw : "NORMAL";
    const clientId = typeof form.get("clientId") === "string" ? String(form.get("clientId")) : undefined;
    return apiSuccess(await sendChatAttachment((await params).conversationId, actor, file, priority, clientId), "Đã gửi tệp", 201);
  } catch (error) { return chatApiError(error, { actor, step: "send-attachment" }); }
}
