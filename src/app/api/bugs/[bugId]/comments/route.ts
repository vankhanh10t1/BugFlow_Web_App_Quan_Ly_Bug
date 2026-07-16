import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { commentSchema } from "@/lib/validators/comment";
import { createComment, listComments } from "@/features/comments/service";
type Context = { params: Promise<{ bugId: string }> };
export async function GET(_: Request, { params }: Context) { try { return apiSuccess(await listComments((await params).bugId, await requireActiveUser()), "Comments retrieved successfully"); } catch (error) { return apiError(error); } }
export async function POST(request: Request, { params }: Context) { try { const parsed = commentSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid comment", 400); return apiSuccess(await createComment((await params).bugId, await requireActiveUser(), parsed.data), "Comment added successfully", 201); } catch (error) { return apiError(error); } }
