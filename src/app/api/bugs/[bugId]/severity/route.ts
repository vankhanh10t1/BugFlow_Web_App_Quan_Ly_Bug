import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { severitySchema } from "@/lib/validators/bug";
import { updateBugSeverity } from "@/features/bugs/service";
import { assertSameOriginRequest } from "@/lib/request-security";
export async function PATCH(request: Request, { params }: { params: Promise<{ bugId: string }> }) { try { assertSameOriginRequest(request); const parsed = severitySchema.safeParse(await request.json()); if (!parsed.success) throw new AppError("VALIDATION_ERROR", "Invalid severity", 400); return apiSuccess(await updateBugSeverity((await params).bugId, await requireActiveUser(), parsed.data.severity), "Severity updated successfully"); } catch (error) { return apiError(error); } }
