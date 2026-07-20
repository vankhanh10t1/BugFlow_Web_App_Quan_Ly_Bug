import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { markAllNotificationsRead } from "@/features/notifications/service";
import { assertSameOriginRequest } from "@/lib/request-security";
export async function PATCH(request: Request) { try { assertSameOriginRequest(request); const user = await requireActiveUser(); return apiSuccess(await markAllNotificationsRead(user.id), "All notifications marked as read"); } catch (error) { return apiError(error); } }
