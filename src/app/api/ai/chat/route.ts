import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceRateLimit, enforceUserMutationLimit } from "@/lib/rate-limit";
import { aiChatSchema } from "@/lib/validators/ai";
import { AppError } from "@/lib/errors";
import { askAi } from "@/features/ai/service";

export async function POST(request: Request) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireActiveUser();
    const input = aiChatSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Yêu cầu AI không hợp lệ", 400);
    await enforceUserMutationLimit("ai:request", actor.id, 10);
    const dailyLimit = Number(process.env.AI_DAILY_USER_LIMIT ?? 50);
    await enforceRateLimit({ scope: "ai:daily", identifier: `user:${actor.id}`, limit: Number.isInteger(dailyLimit) && dailyLimit > 0 ? dailyLimit : 50, windowMs: 24 * 60 * 60_000 });
    return apiSuccess(await askAi(actor, input.data), "AI đã trả lời");
  } catch (error) { return apiError(error); }
}
