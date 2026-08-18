import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { quickEditBugSchema } from "@/lib/validators/bug";
import { assignBug, updateBugDeadline, updateBugLabels, updateBugPriority } from "@/features/bugs/service";
import { transitionBugStatus } from "@/features/bugs/workflow-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ bugId: string }> }) {
  try {
    assertSameOriginRequest(request); const actor = await requireActiveUser(); const parsed = quickEditBugSchema.safeParse(await request.json());
    if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Thay đổi không hợp lệ", 400);
    await enforceUserMutationLimit("bug:quick-edit", actor.id, 40); const id = (await params).bugId; const value = parsed.data;
    const result = value.priority ? await updateBugPriority(id, actor, value.priority)
      : value.status ? await transitionBugStatus(id, actor, value.status)
      : "assigneeId" in value ? await assignBug(id, actor, value.assigneeId ?? null)
      : "dueDate" in value ? await updateBugDeadline(id, actor, value.dueDate || null)
      : await updateBugLabels(id, actor, value.labelIds ?? []);
    return apiSuccess(result, "Đã cập nhật lỗi");
  } catch (error) { return apiError(error); }
}
