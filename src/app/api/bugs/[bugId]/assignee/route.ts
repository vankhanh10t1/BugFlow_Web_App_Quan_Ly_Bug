import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { assignBugSchema } from "@/lib/validators/bug";
import { assignBug } from "@/features/bugs/service";
export async function PATCH(request: Request, { params }: { params: Promise<{ bugId: string }> }) { try { const parsed = assignBugSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid assignee", 400); return apiSuccess(await assignBug((await params).bugId, await requireActiveUser(), parsed.data.assigneeId), "Assignee updated successfully"); } catch (error) { return apiError(error); } }
