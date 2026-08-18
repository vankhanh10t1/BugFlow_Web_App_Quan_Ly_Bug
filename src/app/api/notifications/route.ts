import { apiError, apiSuccess } from "@/lib/api-response";
import { requireActiveUser } from "@/lib/auth";
import { listNotifications, type NotificationFilter } from "@/features/notifications/service";
const filters = new Set<NotificationFilter>(["all", "unread", "mention", "deadline", "chat", "project", "bug", "urgent"]);
export async function GET(request: Request) { try { const user = await requireActiveUser(); const url = new URL(request.url); const requestedPage = Number(url.searchParams.get("page") || 1); const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1; const rawFilter = url.searchParams.get("filter") ?? "all"; const filter = filters.has(rawFilter as NotificationFilter) ? rawFilter as NotificationFilter : "all"; return apiSuccess(await listNotifications(user.id, page, 20, filter), "Đã tải thông báo"); } catch (error) { return apiError(error); } }
