import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { notification: mocks } }));
import { markAllNotificationsRead, markNotificationRead } from "@/features/notifications/service";

describe("notification service", () => {
  beforeEach(() => vi.clearAllMocks());
  it("checks ownership before marking one notification read", async () => { mocks.findFirst.mockResolvedValue(null); await expect(markNotificationRead("notification-1", "user-1")).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" }); expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "notification-1", recipientId: "user-1" } })); expect(mocks.update).not.toHaveBeenCalled(); });
  it("marks only the current user's unread notifications", async () => { mocks.updateMany.mockResolvedValue({ count: 2 }); await markAllNotificationsRead("user-1"); expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { recipientId: "user-1", isRead: false } })); });
});
