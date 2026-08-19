import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSystemRole } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { updateAdminUserStatusSchema } from "@/lib/validators/admin-user";
import { changeAccountStatus } from "@/features/users/admin-service";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";
import { auditRequestContext, getAdminAuditSnapshot, recordAdminAudit } from "@/features/users/admin-audit-service";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireSystemRole(["ADMIN"]);
    const input = updateAdminUserStatusSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", "Trạng thái tài khoản không hợp lệ", 400);
    await enforceUserMutationLimit("admin:mutation", actor.id, 30);
    const id = (await params).id; const before = await getAdminAuditSnapshot(id); const updated = await changeAccountStatus(actor, id, input.data);
    await recordAdminAudit({ adminUserId: actor.id, targetUserId: id, action: "USER_STATUS_CHANGED", beforeValue: before, afterValue: updated, ...auditRequestContext(request) });
    return apiSuccess(updated, "Đã cập nhật trạng thái tài khoản");
  } catch (error) { return apiError(error); }
}
