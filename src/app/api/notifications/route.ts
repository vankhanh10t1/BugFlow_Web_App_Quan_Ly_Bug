import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { listNotifications } from "@/features/notifications/service";
export async function GET(request: Request) { try { const user = await requireActiveUser(); const requestedPage = Number(new URL(request.url).searchParams.get("page") || 1); const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1; return apiSuccess(await listNotifications(user.id, page), "Notifications retrieved successfully"); } catch (error) { return apiError(error); } }
