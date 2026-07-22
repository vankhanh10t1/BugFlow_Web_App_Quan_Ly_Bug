import { apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";
import { chatReactionSchema } from "@/lib/validators/chat";
import { chatApiError } from "@/features/chat/api-error";
import { removeMessageReaction, setMessageReaction, type ChatActor } from "@/features/chat/service";

export async function POST(request: Request, { params }: { params: Promise<{ messageId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    await enforceUserMutationLimit("chat:message:reaction", actor.id, 60);
    const input = chatReactionSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Cảm xúc không hợp lệ", 400);
    const { messageId } = await params;
    return apiSuccess(await setMessageReaction(messageId, actor, input.data.emoji), "Đã cập nhật cảm xúc");
  } catch (error) {
    return chatApiError(error, { actor, step: "set-message-reaction" });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ messageId: string }> }) {
  let actor: ChatActor | null = null;
  try {
    assertSameOriginRequest(request);
    actor = await requireActiveUser();
    await enforceUserMutationLimit("chat:message:reaction", actor.id, 60);
    const { messageId } = await params;
    return apiSuccess(await removeMessageReaction(messageId, actor), "Đã bỏ cảm xúc");
  } catch (error) {
    return chatApiError(error, { actor, step: "remove-message-reaction" });
  }
}
