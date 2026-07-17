import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), createMany: vi.fn(), bugFindMany: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { notification: { findFirst: mocks.findFirst, update: mocks.update, updateMany: mocks.updateMany, createMany: mocks.createMany }, bug: { findMany: mocks.bugFindMany } } }));
import { markAllNotificationsRead, markNotificationRead } from "@/features/notifications/service";
import { createDeadlineNotifications } from "@/features/notifications/deadline-service";

describe("notification service", () => {
  beforeEach(() => vi.clearAllMocks());
  it("checks ownership before marking one notification read", async () => { mocks.findFirst.mockResolvedValue(null); await expect(markNotificationRead("notification-1", "user-1")).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" }); expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "notification-1", recipientId: "user-1" } })); expect(mocks.update).not.toHaveBeenCalled(); });
  it("marks only the current user's unread notifications", async () => { mocks.updateMany.mockResolvedValue({ count: 2 }); await markAllNotificationsRead("user-1"); expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { recipientId: "user-1", isRead: false } })); });
  it("creates one deadline notification per active unique recipient with stable dedupe keys", async () => {
    const now = new Date("2026-07-17T00:00:00.000Z");
    const dueDate = new Date("2026-07-17T12:00:00.000Z");
    mocks.bugFindMany.mockResolvedValue([{ id: "bug-1", bugCode: "SHOP-001", dueDate, reporter: { id: "user-1", accountStatus: "ACTIVE" }, assignee: { id: "user-1", accountStatus: "ACTIVE" } }]);
    mocks.createMany.mockResolvedValue({ count: 1 });
    const result = await createDeadlineNotifications(now, 24);
    expect(mocks.createMany).toHaveBeenCalledWith({ data: [{ recipientId: "user-1", bugId: "bug-1", type: "BUG_DEADLINE_SOON", title: "Lỗi sắp tới hạn", message: "Bug SHOP-001 sắp tới hạn xử lý.", dedupeKey: "deadline:bug-1:2026-07-17T12:00:00.000Z:user-1" }], skipDuplicates: true });
    expect(result.createdNotifications).toBe(1);
  });
  it("does not write when no bugs are nearing deadline", async () => { mocks.bugFindMany.mockResolvedValue([]); const result = await createDeadlineNotifications(new Date("2026-07-17T00:00:00.000Z")); expect(result.createdNotifications).toBe(0); expect(mocks.createMany).not.toHaveBeenCalled(); });
});
