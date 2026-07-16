import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ userFindMany: vi.fn(), commentCreate: vi.fn(), activityCreate: vi.fn(), notificationCreateMany: vi.fn(), transaction: vi.fn(), getAccess: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/features/bugs/service", () => ({ getBugAccessContext: mocks.getAccess }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findMany: mocks.userFindMany }, $transaction: mocks.transaction } }));

import { createComment } from "@/features/comments/service";

describe("comment service", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getAccess.mockResolvedValue({ bug: { projectId: "project-1", reporterId: "reporter-1", assigneeId: "developer-1" }, role: "TESTER" }); mocks.transaction.mockImplementation((callback) => callback({ comment: { create: mocks.commentCreate }, activityLog: { create: mocks.activityCreate }, notification: { createMany: mocks.notificationCreateMany } })); mocks.commentCreate.mockResolvedValue({ id: "comment-1", content: "Please check @developer2", isEdited: false, createdAt: new Date(), updatedAt: new Date(), author: { id: "tester-1", fullName: "Tester", username: "tester", avatarUrl: null } }); mocks.userFindMany.mockResolvedValue([{ id: "developer-2", username: "developer2" }]); });

  it("creates a comment, activity, mention and watcher notifications", async () => { await createComment("bug-1", { id: "tester-1", systemRole: "TESTER" }, { content: "Please check @developer2" }); expect(mocks.commentCreate).toHaveBeenCalledOnce(); expect(mocks.activityCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actionType: "COMMENT_ADDED" }) })); expect(mocks.notificationCreateMany).toHaveBeenCalledWith({ data: expect.arrayContaining([expect.objectContaining({ recipientId: "developer-2", type: "MENTIONED" }), expect.objectContaining({ recipientId: "reporter-1", type: "COMMENT_ADDED" }), expect.objectContaining({ recipientId: "developer-1", type: "COMMENT_ADDED" })]) }); });
});
