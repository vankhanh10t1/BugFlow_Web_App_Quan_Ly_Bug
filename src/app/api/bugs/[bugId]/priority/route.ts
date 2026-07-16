import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { prioritySchema } from "@/lib/validators/bug";
import { updateBugPriority } from "@/features/bugs/service";
export async function PATCH(request: Request, { params }: { params: Promise<{ bugId: string }> }) { try { const parsed = prioritySchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid priority", 400); return apiSuccess(await updateBugPriority((await params).bugId, await requireActiveUser(), parsed.data.priority), "Priority updated successfully"); } catch (error) { return apiError(error); } }
