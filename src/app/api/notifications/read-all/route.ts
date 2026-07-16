import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { markAllNotificationsRead } from "@/features/notifications/service";
export async function PATCH() { try { const user = await requireActiveUser(); return apiSuccess(await markAllNotificationsRead(user.id), "All notifications marked as read"); } catch (error) { return apiError(error); } }
