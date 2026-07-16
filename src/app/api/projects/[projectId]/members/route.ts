import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { addProjectMemberSchema } from "@/lib/validators/project";
import { addProjectMember } from "@/features/projects/service";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const actor = await requireActiveUser();
    const input = addProjectMemberSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", "Invalid member data", 400);
    return apiSuccess(await addProjectMember((await params).projectId, actor, input.data.userId, input.data.role), "Member added successfully", 201);
  } catch (error) { return apiError(error); }
}
