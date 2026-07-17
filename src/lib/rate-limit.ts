import "server-only";
import { createHash } from "node:crypto";
import { AppError } from "@/lib/errors";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimitKey(value: string) { return createHash("sha256").update(value.trim().toLowerCase()).digest("hex"); }

export function consumeRateLimit(scope: string, identifier: string, limit: number, windowMs: number, now = Date.now()) {
  const key = `${scope}:${identifier}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return; }
  if (current.count >= limit) throw new AppError("FORBIDDEN", "Bạn đã thử quá nhiều lần. Vui lòng đợi rồi thử lại.", 429);
  current.count += 1;
}
