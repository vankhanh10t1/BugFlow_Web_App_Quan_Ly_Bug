import { requireActiveUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { createAttachment } from "@/features/attachments/service";
export async function POST(request: Request) { try { const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File)) return apiError(new AppError("VALIDATION_ERROR", "File is required", 400)); const rawBugId = form.get("bugId"); const rawCommentId = form.get("commentId"); const bugId = typeof rawBugId === "string" ? rawBugId || null : null; const commentId = typeof rawCommentId === "string" ? rawCommentId || null : null; return apiSuccess(await createAttachment(file, bugId, commentId, await requireActiveUser()), "Attachment uploaded", 201); } catch (error) { return apiError(error); } }
