import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

const RATE_LIMIT_MESSAGE = "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại sau.";

export type RateLimitRule = {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function requestIp(request?: Request) {
  const requestHeaders = request?.headers ?? await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || requestHeaders.get("x-real-ip")?.trim() || "unknown";
}

async function tryConsume(id: string, rule: RateLimitRule, now: Date, expiresAt: Date) {
  const incremented = await prisma.rateLimitBucket.updateMany({
    where: { id, expiresAt: { gt: now }, count: { lt: rule.limit } },
    data: { count: { increment: 1 } },
  });
  if (incremented.count === 1) return true;

  const active = await prisma.rateLimitBucket.findUnique({ where: { id }, select: { expiresAt: true } });
  if (active && active.expiresAt > now) return false;

  if (active) {
    const reset = await prisma.rateLimitBucket.updateMany({
      where: { id, expiresAt: { lte: now } },
      data: { scope: rule.scope, count: 1, windowStart: now, expiresAt },
    });
    return reset.count === 1 ? true : null;
  }

  try {
    await prisma.rateLimitBucket.create({ data: { id, scope: rule.scope, count: 1, windowStart: now, expiresAt } });
    return true;
  } catch {
    return null;
  }
}

export async function enforceRateLimit(rule: RateLimitRule, now = new Date()) {
  if (!Number.isInteger(rule.limit) || rule.limit < 1 || !Number.isFinite(rule.windowMs) || rule.windowMs < 1) {
    throw new Error("Invalid rate-limit rule");
  }
  const id = digest(`${rule.scope}:${rule.identifier}`);
  const expiresAt = new Date(now.getTime() + rule.windowMs);
  let consumed = await tryConsume(id, rule, now, expiresAt);
  if (consumed === null) consumed = await tryConsume(id, rule, now, expiresAt);
  if (!consumed) throw new AppError("RATE_LIMITED", RATE_LIMIT_MESSAGE, 429);

  // Deterministic, low-frequency cleanup without adding a scheduler or a request-wide scan.
  if (id.endsWith("00")) {
    const staleBefore = new Date(now.getTime() - 24 * 60 * 60_000);
    void prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: staleBefore } } }).catch(() => undefined);
  }
}

export async function enforceUserMutationLimit(scope: string, userId: string, limit = 20, windowMs = 60_000) {
  return enforceRateLimit({ scope, identifier: `user:${userId}`, limit, windowMs });
}

export async function enforceLoginLimit(ip: string, email: string) {
  await enforceRateLimit({ scope: "auth:login:ip", identifier: `ip:${ip}`, limit: 5, windowMs: 10 * 60_000 });
  await enforceRateLimit({ scope: "auth:login:email", identifier: `email:${email}`, limit: 5, windowMs: 10 * 60_000 });
}

export async function enforceTwoFactorLimit(ip: string, challengeToken: string) {
  await enforceRateLimit({ scope: "auth:2fa:ip", identifier: `ip:${ip}`, limit: 5, windowMs: 10 * 60_000 });
  await enforceRateLimit({ scope: "auth:2fa:challenge", identifier: `challenge:${challengeToken}`, limit: 5, windowMs: 10 * 60_000 });
}

export async function enforceRegistrationLimit(ip: string, email: string) {
  await enforceRateLimit({ scope: "auth:register:ip", identifier: `ip:${ip}`, limit: 5, windowMs: 60 * 60_000 });
  await enforceRateLimit({ scope: "auth:register:email", identifier: `email:${email}`, limit: 5, windowMs: 60 * 60_000 });
}

export { RATE_LIMIT_MESSAGE };
