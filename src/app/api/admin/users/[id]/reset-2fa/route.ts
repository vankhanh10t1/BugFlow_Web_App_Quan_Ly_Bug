import { apiError, apiSuccess } from "@/lib/api-response";
import { requireSystemRole } from "@/lib/auth";
import { resetTwoFactor } from "@/features/users/admin-service";
import { auditRequestContext, getAdminAuditSnapshot, recordAdminAudit } from "@/features/users/admin-audit-service";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { assertSameOriginRequest(request); const actor = await requireSystemRole(["ADMIN"]); await enforceUserMutationLimit("admin:mutation", actor.id, 30); const id = (await params).id; const before = await getAdminAuditSnapshot(id); const updated = await resetTwoFactor(actor, id); await recordAdminAudit({ adminUserId: actor.id, targetUserId: id, action: "USER_2FA_RESET", beforeValue: before, afterValue: updated, ...auditRequestContext(request) }); return apiSuccess(updated, "Đã đặt lại 2FA và thu hồi phiên đăng nhập"); } catch (error) { return apiError(error); } }
