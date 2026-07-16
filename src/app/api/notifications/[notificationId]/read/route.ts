import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { markNotificationRead } from "@/features/notifications/service";
export async function PATCH(_: Request, { params }: { params: Promise<{ notificationId: string }> }) { try { const user = await requireActiveUser(); return apiSuccess(await markNotificationRead((await params).notificationId, user.id), "Notification marked as read"); } catch (error) { return apiError(error); } }
