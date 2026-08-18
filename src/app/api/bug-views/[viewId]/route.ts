import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { savedViewUpdateSchema } from "@/lib/validators/bug";
import { deleteSavedView, updateSavedView } from "@/features/bugs/saved-view-service";
type Context = { params: Promise<{ viewId: string }> };
export async function PATCH(request: Request, { params }: Context) { try { assertSameOriginRequest(request); const actor = await requireActiveUser(); const parsed = savedViewUpdateSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Dữ liệu không hợp lệ", 400); await enforceUserMutationLimit("bug-view:update", actor.id, 30); return apiSuccess(await updateSavedView((await params).viewId, actor, parsed.data), "Đã cập nhật chế độ xem"); } catch (error) { return apiError(error); } }
export async function DELETE(request: Request, { params }: Context) { try { assertSameOriginRequest(request); const actor = await requireActiveUser(); await enforceUserMutationLimit("bug-view:delete", actor.id, 20); await deleteSavedView((await params).viewId, actor); return apiSuccess(null, "Đã xóa chế độ xem"); } catch (error) { return apiError(error); } }
