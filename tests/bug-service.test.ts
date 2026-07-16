import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  projectFindUnique: vi.fn(), projectUpdate: vi.fn(), memberFindUnique: vi.fn(),
  bugFindFirst: vi.fn(), bugCreate: vi.fn(), bugUpdate: vi.fn(), activityCreate: vi.fn(), notificationCreate: vi.fn(), transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  project: { findUnique: mocks.projectFindUnique }, projectMember: { findUnique: mocks.memberFindUnique }, bug: { findFirst: mocks.bugFindFirst },
  $transaction: mocks.transaction,
} }));

import { assignBug, createBug, getBug } from "@/features/bugs/service";

const bugInput = { projectId: "project-1", title: "Checkout fails on Safari", description: "The checkout request fails after submitting payment.", priority: "HIGH" as const, severity: "CRITICAL" as const };

describe("bug service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback) => callback({ project: { update: mocks.projectUpdate }, bug: { create: mocks.bugCreate, update: mocks.bugUpdate }, activityLog: { create: mocks.activityCreate }, notification: { create: mocks.notificationCreate } }));
  });

  it("creates a readable bug code from an atomic project counter", async () => {
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1", status: "ACTIVE" });
    mocks.memberFindUnique.mockResolvedValue({ role: "TESTER" });
    mocks.projectUpdate.mockResolvedValue({ code: "SHOP", nextBugNumber: 22 });
    mocks.bugCreate.mockImplementation(({ data }) => Promise.resolve({ id: "bug-1", ...data }));
    mocks.activityCreate.mockResolvedValue({});
    const bug = await createBug({ id: "tester-1", systemRole: "TESTER" }, bugInput);
    expect(mocks.projectUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { nextBugNumber: { increment: 1 } } }));
    expect(bug.bugCode).toBe("SHOP-021");
    expect(mocks.activityCreate).toHaveBeenCalledOnce();
  });

  it("assigns an active project developer and records audit plus notification", async () => {
    mocks.bugFindFirst.mockResolvedValue({ id: "bug-1", projectId: "project-1", reporterId: "tester-1", assigneeId: null, status: "NEW", priority: "HIGH", severity: "MAJOR" });
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1", status: "ACTIVE" });
    mocks.memberFindUnique.mockResolvedValueOnce({ role: "MANAGER" }).mockResolvedValueOnce({ role: "DEVELOPER", user: { accountStatus: "ACTIVE" } });
    mocks.bugUpdate.mockResolvedValue({ id: "bug-1", bugCode: "SHOP-001", title: "Checkout fails", status: "ASSIGNED" });
    await assignBug("bug-1", { id: "manager-1", systemRole: "PROJECT_MANAGER" }, "developer-1");
    expect(mocks.bugUpdate).toHaveBeenCalledWith({ where: { id: "bug-1" }, data: { assigneeId: "developer-1", status: "ASSIGNED" } });
    expect(mocks.activityCreate).toHaveBeenCalledOnce();
    expect(mocks.notificationCreate).toHaveBeenCalledOnce();
  });

  it("blocks an outsider from reading a bug by guessing its id", async () => {
    mocks.bugFindFirst.mockResolvedValue({ id: "bug-1", projectId: "project-1", reporterId: "tester-1", assigneeId: null, status: "NEW", priority: "HIGH", severity: "MAJOR" });
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1", status: "ACTIVE" });
    mocks.memberFindUnique.mockResolvedValue(null);
    await expect(getBug("bug-1", { id: "outsider-1", systemRole: "DEVELOPER" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
