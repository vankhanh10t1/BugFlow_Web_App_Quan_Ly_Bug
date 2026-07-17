import { timingSafeEqual } from "node:crypto";
import { apiError, apiSuccess } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { createDeadlineNotifications } from "@/features/notifications/deadline-service";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;
  const provided = authorization.slice(7);
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function GET(request: Request) {
  try {
    if (!authorized(request)) throw new AppError("UNAUTHORIZED", "Cron secret không hợp lệ", 401);
    return apiSuccess(await createDeadlineNotifications(), "Đã xử lý notification deadline");
  } catch (error) { return apiError(error); }
}
