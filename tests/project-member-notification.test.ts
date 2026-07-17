import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ projectFindUnique: vi.fn(), userFindUnique: vi.fn(), membershipFindUnique: vi.fn(), memberCreate: vi.fn(), activityCreate: vi.fn(), notificationCreate: vi.fn(), transaction: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  project: { findUnique: mocks.projectFindUnique }, user: { findUnique: mocks.userFindUnique }, projectMember: { findUnique: mocks.membershipFindUnique },
  $transaction: mocks.transaction,
} }));

import { addProjectMember } from "@/features/projects/service";

describe("project member notification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback) => callback({ projectMember: { create: mocks.memberCreate }, activityLog: { create: mocks.activityCreate }, notification: { create: mocks.notificationCreate } }));
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1", name: "Commerce Platform" });
    mocks.membershipFindUnique.mockResolvedValueOnce({ role: "MANAGER" }).mockResolvedValueOnce(null);
    mocks.userFindUnique.mockResolvedValue({ id: "tester-1", accountStatus: "ACTIVE" });
    mocks.memberCreate.mockResolvedValue({ id: "member-1", role: "TESTER", user: { id: "tester-1" } });
  });

  it("creates a project-target notification in the same member transaction", async () => {
    await addProjectMember("project-1", { id: "manager-1", systemRole: "PROJECT_MANAGER" }, "tester-1", "TESTER");
    expect(mocks.notificationCreate).toHaveBeenCalledWith({ data: { recipientId: "tester-1", actorId: "manager-1", projectId: "project-1", type: "PROJECT_MEMBER_ADDED", title: "Bạn đã được thêm vào dự án", message: "Bạn đã được thêm vào dự án: Commerce Platform" } });
  });
});
