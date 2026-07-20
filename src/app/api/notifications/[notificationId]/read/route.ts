import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { markNotificationRead } from "@/features/notifications/service";
import { assertSameOriginRequest } from "@/lib/request-security";
export async function PATCH(request: Request, { params }: { params: Promise<{ notificationId: string }> }) { try { assertSameOriginRequest(request); const user = await requireActiveUser(); return apiSuccess(await markNotificationRead((await params).notificationId, user.id), "Notification marked as read"); } catch (error) { return apiError(error); } }
