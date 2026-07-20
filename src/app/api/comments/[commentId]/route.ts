import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { commentSchema } from "@/lib/validators/comment";
import { deleteComment, updateComment } from "@/features/comments/service";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";
type Context = { params: Promise<{ commentId: string }> };
export async function PATCH(request: Request, { params }: Context) { try { assertSameOriginRequest(request); const parsed = commentSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid comment", 400); const actor = await requireActiveUser(); await enforceUserMutationLimit("comment:update", actor.id, 30); return apiSuccess(await updateComment((await params).commentId, actor, parsed.data), "Comment updated successfully"); } catch (error) { return apiError(error); } }
export async function DELETE(request: Request, { params }: Context) { try { assertSameOriginRequest(request); await deleteComment((await params).commentId, await requireActiveUser()); return apiSuccess(null, "Comment deleted successfully"); } catch (error) { return apiError(error); } }
