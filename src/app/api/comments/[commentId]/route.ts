import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { commentSchema } from "@/lib/validators/comment";
import { deleteComment, updateComment } from "@/features/comments/service";
type Context = { params: Promise<{ commentId: string }> };
export async function PATCH(request: Request, { params }: Context) { try { const parsed = commentSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid comment", 400); return apiSuccess(await updateComment((await params).commentId, await requireActiveUser(), parsed.data), "Comment updated successfully"); } catch (error) { return apiError(error); } }
export async function DELETE(_: Request, { params }: Context) { try { await deleteComment((await params).commentId, await requireActiveUser()); return apiSuccess(null, "Comment deleted successfully"); } catch (error) { return apiError(error); } }
