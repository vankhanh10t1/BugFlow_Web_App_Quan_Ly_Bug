import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { getPreferences, updatePreferences } from "@/features/notifications/service";
import { AppError } from "@/lib/errors";

export async function GET() {
  try { const user = await requireActiveUser(); return apiSuccess(await getPreferences(user.id), "Đã tải tùy chọn thông báo"); }
  catch (error) { return apiError(error); }
}

export async function PATCH(request: Request) {
  try {
    assertSameOriginRequest(request);
    const user = await requireActiveUser();
    await enforceUserMutationLimit("notification:preferences", user.id, 20);
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AppError("VALIDATION_ERROR", "Dữ liệu không hợp lệ", 400);
    return apiSuccess(await updatePreferences(user.id, body as Record<string, boolean>), "Đã lưu tùy chọn thông báo");
  } catch (error) { return apiError(error); }
}
