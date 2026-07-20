import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { updateProjectMemberSchema } from "@/lib/validators/project";
import { removeProjectMember, updateProjectMemberRole } from "@/features/projects/service";
import { assertSameOriginRequest } from "@/lib/request-security";

type Context = { params: Promise<{ projectId: string; memberId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    assertSameOriginRequest(request);
    const actor = await requireActiveUser(); const ids = await params;
    const input = updateProjectMemberSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", "Invalid project role", 400);
    return apiSuccess(await updateProjectMemberRole(ids.projectId, ids.memberId, actor, input.data.role), "Member role updated successfully");
  } catch (error) { return apiError(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  try { assertSameOriginRequest(request); const actor = await requireActiveUser(); const ids = await params; await removeProjectMember(ids.projectId, ids.memberId, actor); return apiSuccess(null, "Member removed successfully"); } catch (error) { return apiError(error); }
}
