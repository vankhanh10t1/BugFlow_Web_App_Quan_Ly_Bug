import { requireActiveUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getProjectDashboard } from "@/features/dashboard/service";
export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) { try { const { projectId } = await params; return apiSuccess(await getProjectDashboard(projectId, await requireActiveUser()), "Project dashboard retrieved successfully"); } catch (error) { return apiError(error); } }
