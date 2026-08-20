import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { assertSameOriginRequest } from "@/lib/request-security";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { deleteBugLink } from "@/features/bugs/link-service";
type Context = { params: Promise<{ bugId: string; linkId: string }> };
export async function DELETE(request: Request, { params }: Context) { try { assertSameOriginRequest(request); const actor = await requireActiveUser(); await enforceUserMutationLimit("bug-link:delete", actor.id, 20); const { bugId, linkId } = await params; return apiSuccess(await deleteBugLink(bugId, linkId, actor), "Đã xóa liên kết bug"); } catch (error) { return apiError(error); } }
