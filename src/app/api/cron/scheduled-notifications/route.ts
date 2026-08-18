import { apiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { runScheduledNotificationWorker } from "@/features/notifications/deadline-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isCronAuthorized } from "@/lib/cron-auth";
export async function GET(request: Request) { try { if (!isCronAuthorized(request)) throw new AppError("UNAUTHORIZED", "Cron secret không hợp lệ", 401); await enforceRateLimit({ scope: "notification:scheduled-job", identifier: "global", limit: 12, windowMs: 60_000 }); const result = await runScheduledNotificationWorker(); console.info("[scheduled-notifications]", JSON.stringify(result)); return apiSuccess(result, "Đã xử lý notification theo lịch"); } catch (error) { return apiError(error); } }
