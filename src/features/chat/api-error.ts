import "server-only";
import { apiError } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import type { ChatActor } from "@/features/chat/service";

type ChatFailureContext = { actor?: ChatActor | null; step: string; event?: string };

function databaseCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

export function chatApiError(error: unknown, { actor, step, event }: ChatFailureContext) {
  if (error instanceof AppError) return apiError(error);

  console.error(event ?? "[chat] request failed", {
    userId: actor?.id ?? null,
    role: actor?.systemRole ?? null,
    step,
    error: error instanceof Error ? error.message : String(error),
  });

  const code = databaseCode(error);
  if (code === "P2021" || code === "P2022") {
    return apiError(new AppError("DATABASE_ERROR", "Dữ liệu chat chưa được khởi tạo. Quản trị viên cần chạy migration database.", 503));
  }
  return apiError(new AppError("DATABASE_ERROR", "Không thể tải dữ liệu chat lúc này. Vui lòng thử lại sau.", 500));
}
