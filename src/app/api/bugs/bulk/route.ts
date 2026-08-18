import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { bulkBugSchema } from "@/lib/validators/bug";
import { assignBug, updateBugPriority } from "@/features/bugs/service";
import { transitionBugStatus } from "@/features/bugs/workflow-service";
import type { BugPriority, BugStatus } from "@/generated/prisma/client";

export async function PATCH(request: Request) {
  try {
    assertSameOriginRequest(request); const actor = await requireActiveUser(); const parsed = bulkBugSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Thao tác hàng loạt không hợp lệ", 400);
    await enforceUserMutationLimit("bug:bulk", actor.id, 10); const succeeded: string[] = []; const failed: { bugId: string; message: string }[] = [];
    for (const bugId of parsed.data.bugIds) {
      try {
        if (parsed.data.action === "assign") await assignBug(bugId, actor, parsed.data.value || null);
        else if (parsed.data.action === "priority") await updateBugPriority(bugId, actor, parsed.data.value as BugPriority);
        else await transitionBugStatus(bugId, actor, parsed.data.value as BugStatus);
        succeeded.push(bugId);
      } catch (error) { failed.push({ bugId, message: error instanceof AppError ? error.message : "Không thể cập nhật" }); }
    }
    return apiSuccess({ succeeded, failed }, failed.length ? "Một số lỗi không thể cập nhật" : "Đã cập nhật các lỗi đã chọn");
  } catch (error) { return apiError(error); }
}
