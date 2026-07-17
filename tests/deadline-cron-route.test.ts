import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createDeadlineNotifications: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/features/notifications/deadline-service", () => ({ createDeadlineNotifications: mocks.createDeadlineNotifications }));
import { GET } from "@/app/api/cron/deadline-notifications/route";

describe("deadline notification cron route", () => {
  const previous = process.env.CRON_SECRET;
  beforeEach(() => { vi.clearAllMocks(); process.env.CRON_SECRET = "test-cron-secret"; });
  afterEach(() => { process.env.CRON_SECRET = previous; });

  it("rejects requests without the cron secret", async () => {
    const response = await GET(new Request("http://localhost/api/cron/deadline-notifications"));
    expect(response.status).toBe(401);
    expect(mocks.createDeadlineNotifications).not.toHaveBeenCalled();
  });

  it("runs the deadline job with a valid bearer secret", async () => {
    mocks.createDeadlineNotifications.mockResolvedValue({ createdNotifications: 2 });
    const response = await GET(new Request("http://localhost/api/cron/deadline-notifications", { headers: { authorization: "Bearer test-cron-secret" } }));
    expect(response.status).toBe(200);
    expect(mocks.createDeadlineNotifications).toHaveBeenCalledOnce();
  });
});
