import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ worker: vi.fn(), rateLimit: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/features/notifications/deadline-service", () => ({ runScheduledNotificationWorker: mocks.worker }));
vi.mock("@/lib/rate-limit", () => ({ enforceRateLimit: mocks.rateLimit }));
import { GET } from "@/app/api/cron/scheduled-notifications/route";

describe("scheduled notification cron route", () => {
  const previous = process.env.CRON_SECRET;
  beforeEach(() => { vi.clearAllMocks(); process.env.CRON_SECRET = "test-cron-secret"; });
  afterEach(() => { process.env.CRON_SECRET = previous; });
  it("returns 500 when CRON_SECRET is not configured", async () => { delete process.env.CRON_SECRET; const response = await GET(new Request("http://localhost/api/cron/scheduled-notifications")); expect(response.status).toBe(500); expect(mocks.worker).not.toHaveBeenCalled(); });
  it("returns 401 for a missing or invalid bearer secret", async () => { const response = await GET(new Request("http://localhost/api/cron/scheduled-notifications", { headers: { authorization: "Bearer wrong" } })); expect(response.status).toBe(401); expect(mocks.worker).not.toHaveBeenCalled(); });
  it("runs the shared worker and returns a stable response", async () => { mocks.worker.mockResolvedValue({ checkedAt: "2026-08-18T00:00:00.000Z", createdNotifications: 3, failedItems: 0, deadlines: { scannedBugs: 2 }, reminders: { processedReminders: 1 } }); const response = await GET(new Request("http://localhost/api/cron/scheduled-notifications", { headers: { authorization: "Bearer test-cron-secret" } })); expect(response.status).toBe(200); await expect(response.json()).resolves.toEqual({ ok: true, processed: { bugDeadlines: 2, chatReminders: 1 }, createdNotifications: 3, failedItems: 0, checkedAt: "2026-08-18T00:00:00.000Z" }); expect(mocks.rateLimit).toHaveBeenCalledOnce(); expect(mocks.worker).toHaveBeenCalledOnce(); });
});
