import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => new Map<string, { scope: string; count: number; windowStart: Date; expiresAt: Date }>());
const mocks = vi.hoisted(() => ({ deleteMany: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })) }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    rateLimitBucket: {
      updateMany: vi.fn(async ({ where, data }) => {
        const bucket = state.get(where.id);
        if (!bucket) return { count: 0 };
        if (where.expiresAt?.gt && !(bucket.expiresAt > where.expiresAt.gt)) return { count: 0 };
        if (where.expiresAt?.lte && !(bucket.expiresAt <= where.expiresAt.lte)) return { count: 0 };
        if (where.count?.lt && !(bucket.count < where.count.lt)) return { count: 0 };
        state.set(where.id, {
          ...bucket,
          scope: data.scope ?? bucket.scope,
          count: data.count?.increment ? bucket.count + data.count.increment : data.count ?? bucket.count,
          windowStart: data.windowStart ?? bucket.windowStart,
          expiresAt: data.expiresAt ?? bucket.expiresAt,
        });
        return { count: 1 };
      }),
      findUnique: vi.fn(async ({ where }) => { const bucket = state.get(where.id); return bucket ? { expiresAt: bucket.expiresAt } : null; }),
      create: vi.fn(async ({ data }) => { if (state.has(data.id)) throw new Error("duplicate"); state.set(data.id, data); return data; }),
      deleteMany: mocks.deleteMany.mockResolvedValue({ count: 0 }),
    },
  },
}));

import { enforceRateLimit, requestIp } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

describe("persistent rate limiter", () => {
  beforeEach(() => { state.clear(); vi.clearAllMocks(); });

  it("allows up to the configured limit and then returns a 429 AppError", async () => {
    const rule = { scope: "test", identifier: "user:secret@example.com", limit: 2, windowMs: 60_000 };
    await enforceRateLimit(rule, new Date("2026-07-19T00:00:00Z"));
    await enforceRateLimit(rule, new Date("2026-07-19T00:00:01Z"));
    await expect(enforceRateLimit(rule, new Date("2026-07-19T00:00:02Z"))).rejects.toMatchObject({ status: 429, code: "RATE_LIMITED" });
    expect([...state.keys()][0]).not.toContain("secret@example.com");
  });

  it("starts a new window after the previous bucket expires", async () => {
    const rule = { scope: "test", identifier: "user:1", limit: 1, windowMs: 1_000 };
    await enforceRateLimit(rule, new Date("2026-07-19T00:00:00Z"));
    await enforceRateLimit(rule, new Date("2026-07-19T00:00:02Z"));
    expect([...state.values()][0].count).toBe(1);
  });

  it("uses the first trusted forwarded address for Server Actions", async () => {
    await expect(requestIp()).resolves.toBe("203.0.113.7");
  });

  it("serializes rate-limit failures as a Vietnamese HTTP 429 response", async () => {
    const response = apiError(new AppError("RATE_LIMITED", "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại sau.", 429));
    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({ success: false, error: expect.stringContaining("Vui lòng"), message: expect.stringContaining("Vui lòng") });
  });
});
