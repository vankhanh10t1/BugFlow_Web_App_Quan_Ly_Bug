import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { listBugActivities } from "@/features/activities/service";
export async function GET(_: Request, { params }: { params: Promise<{ bugId: string }> }) { try { return apiSuccess(await listBugActivities((await params).bugId, await requireActiveUser()), "Activities retrieved successfully"); } catch (error) { return apiError(error); } }
