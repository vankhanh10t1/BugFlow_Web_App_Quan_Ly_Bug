import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { commentSchema } from "@/lib/validators/comment";
import { createComment, listComments } from "@/features/comments/service";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";
type Context = { params: Promise<{ bugId: string }> };
export async function GET(_: Request, { params }: Context) { try { return apiSuccess(await listComments((await params).bugId, await requireActiveUser()), "Comments retrieved successfully"); } catch (error) { return apiError(error); } }
export async function POST(request: Request, { params }: Context) { try { assertSameOriginRequest(request); const parsed = commentSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid comment", 400); const actor = await requireActiveUser(); await enforceUserMutationLimit("comment:create", actor.id); return apiSuccess(await createComment((await params).bugId, actor, parsed.data), "Comment added successfully", 201); } catch (error) { return apiError(error); } }
