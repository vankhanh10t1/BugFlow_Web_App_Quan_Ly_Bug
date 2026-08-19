import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSystemRole } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { updateAdminUserSchema } from "@/lib/validators/admin-user";
import { deactivateUser, updateUserByAdmin } from "@/features/users/admin-service";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";
import { auditRequestContext, getAdminAuditSnapshot, recordAdminAudit } from "@/features/users/admin-audit-service";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireSystemRole(["ADMIN"]);
    const input = updateAdminUserSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", input.error.issues[0]?.message ?? "Dữ liệu người dùng không hợp lệ", 400);
    await enforceUserMutationLimit("admin:mutation", actor.id, 30);
    const id = (await params).id; const before = await getAdminAuditSnapshot(id); const updated = await updateUserByAdmin(actor, id, input.data); await recordAdminAudit({ adminUserId: actor.id, targetUserId: id, action: "USER_UPDATED", beforeValue: before, afterValue: updated, ...auditRequestContext(request) }); return apiSuccess(updated, "Đã cập nhật người dùng");
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireSystemRole(["ADMIN"]);
    await enforceUserMutationLimit("admin:mutation", actor.id, 30);
    const id = (await params).id; const before = await getAdminAuditSnapshot(id); const updated = await deactivateUser(actor, id); await recordAdminAudit({ adminUserId: actor.id, targetUserId: id, action: "USER_DEACTIVATED", beforeValue: before, afterValue: updated, ...auditRequestContext(request) }); return apiSuccess(updated, "Đã vô hiệu hóa tài khoản");
  } catch (error) { return apiError(error); }
}
