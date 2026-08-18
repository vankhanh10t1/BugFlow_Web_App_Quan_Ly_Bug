import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { runScheduledNotificationWorker } from "@/features/notifications/deadline-service";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isCronAuthorized } from "@/lib/cron-auth";

export async function GET(request: Request) {
  let step = "configuration";
  try {
    if (!process.env.CRON_SECRET) throw new AppError("DATABASE_ERROR", "Scheduled notification worker chưa được cấu hình", 500);
    step = "authorization";
    if (!isCronAuthorized(request)) throw new AppError("UNAUTHORIZED", "Cron secret không hợp lệ", 401);
    step = "rate-limit";
    await enforceRateLimit({ scope: "notification:scheduled-job", identifier: "global", limit: 12, windowMs: 60_000 });
    step = "worker";
    const result = await runScheduledNotificationWorker();
    console.info("[cron:scheduled-notifications] completed", { createdNotifications: result.createdNotifications, failedItems: result.failedItems });
    return NextResponse.json({
      ok: true,
      processed: { bugDeadlines: result.deadlines.scannedBugs, chatReminders: result.reminders.processedReminders },
      createdNotifications: result.createdNotifications,
      failedItems: result.failedItems,
      checkedAt: result.checkedAt,
    });
  } catch (error) {
    if (!(error instanceof AppError) || error.status >= 500) console.error("[cron:scheduled-notifications] failed", { step, error: error instanceof Error ? error.message : String(error) });
    return apiError(error);
  }
}
