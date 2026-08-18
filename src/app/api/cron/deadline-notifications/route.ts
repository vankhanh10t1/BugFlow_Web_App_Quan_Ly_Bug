import { apiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { createDeadlineNotifications } from "@/features/notifications/deadline-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isCronAuthorized } from "@/lib/cron-auth";
export async function GET(request: Request) { try { if (!isCronAuthorized(request)) throw new AppError("UNAUTHORIZED", "Cron secret không hợp lệ", 401); await enforceRateLimit({ scope: "notification:deadline-job", identifier: "global", limit: 5, windowMs: 60_000 }); return apiSuccess(await createDeadlineNotifications(), "Đã xử lý notification deadline"); } catch (error) { return apiError(error); } }
