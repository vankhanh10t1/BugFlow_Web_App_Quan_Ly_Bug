import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { projectInputSchema } from "@/lib/validators/project";
import { getProject, updateProject } from "@/features/projects/service";
import { assertSameOriginRequest } from "@/lib/request-security";

type Context = { params: Promise<{ projectId: string }> };

export async function GET(_: Request, { params }: Context) {
  try { const actor = await requireActiveUser(); return apiSuccess(await getProject((await params).projectId, actor), "Project retrieved successfully"); } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireActiveUser();
    const input = projectInputSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", "Invalid project data", 400);
    return apiSuccess(await updateProject((await params).projectId, actor, input.data), "Project updated successfully");
  } catch (error) { return apiError(error); }
}
