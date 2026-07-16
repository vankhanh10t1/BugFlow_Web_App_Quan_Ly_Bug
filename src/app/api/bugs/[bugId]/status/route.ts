import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { statusTransitionSchema } from "@/lib/validators/workflow";
import { transitionBugStatus } from "@/features/bugs/workflow-service";
export async function PATCH(request: Request, { params }: { params: Promise<{ bugId: string }> }) { try { const parsed = statusTransitionSchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid status", 400); return apiSuccess(await transitionBugStatus((await params).bugId, await requireActiveUser(), parsed.data.status), "Status updated successfully"); } catch (error) { return apiError(error); } }
