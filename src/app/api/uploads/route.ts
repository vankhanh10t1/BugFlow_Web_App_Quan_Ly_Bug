import { requireActiveUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { createAttachment } from "@/features/attachments/service";
import { enforceUserMutationLimit } from "@/lib/rate-limit";
import { assertSameOriginRequest } from "@/lib/request-security";
export async function POST(request: Request) { try { assertSameOriginRequest(request); const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return apiError(new AppError("VALIDATION_ERROR", "File is required", 400)); const rawBugId = form.get("bugId"); const rawCommentId = form.get("commentId"); const bugId = typeof rawBugId === "string" ? rawBugId || null : null; const commentId = typeof rawCommentId === "string" ? rawCommentId || null : null; const actor = await requireActiveUser(); await enforceUserMutationLimit("attachment:upload", actor.id, 10); return apiSuccess(await createAttachment(file, bugId, commentId, actor), "Attachment uploaded", 201); } catch (error) { return apiError(error); } }
