import { requireActiveUser } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getOverviewDashboard } from "@/features/dashboard/service";
export async function GET() { try { return apiSuccess(await getOverviewDashboard(await requireActiveUser()), "Dashboard overview retrieved successfully"); } catch (error) { return apiError(error); } }
