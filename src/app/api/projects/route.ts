import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { projectInputSchema, projectQuerySchema } from "@/lib/validators/project";
import { createProject, listProjects } from "@/features/projects/service";

export async function GET(request: Request) {
  try {
    const actor = await requireActiveUser();
    const query = projectQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) throw new AppError("VALIDATION_ERROR", "Invalid project filters", 400);
    return apiSuccess(await listProjects(actor, query.data), "Projects retrieved successfully");
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActiveUser();
    const input = projectInputSchema.safeParse(await request.json());
    if (!input.success) throw new AppError("VALIDATION_ERROR", "Invalid project data", 400);
    return apiSuccess(await createProject(actor, input.data), "Project created successfully", 201);
  } catch (error) { return apiError(error); }
}
