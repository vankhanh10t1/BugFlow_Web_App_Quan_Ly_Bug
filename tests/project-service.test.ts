import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  projectFindUnique: vi.fn(), projectCreate: vi.fn(), memberCreate: vi.fn(), transaction: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  project: { findUnique: mocks.projectFindUnique },
  $transaction: mocks.transaction,
} }));

import { createProject } from "@/features/projects/service";

describe("project service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation((callback) => callback({ project: { create: mocks.projectCreate }, projectMember: { create: mocks.memberCreate } }));
  });

  it("creates the project and manager membership in one transaction", async () => {
    mocks.projectFindUnique.mockResolvedValue(null);
    mocks.projectCreate.mockResolvedValue({ id: "project-1", code: "SHOP" });
    mocks.memberCreate.mockResolvedValue({ id: "member-1" });
    const project = await createProject({ id: "manager-1", systemRole: "PROJECT_MANAGER" }, { code: "SHOP", name: "Commerce Platform", status: "ACTIVE" });
    expect(project.id).toBe("project-1");
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.memberCreate).toHaveBeenCalledWith({ data: { projectId: "project-1", userId: "manager-1", role: "MANAGER" } });
  });

  it("rejects project creation from a developer", async () => {
    await expect(createProject({ id: "developer-1", systemRole: "DEVELOPER" }, { code: "SHOP", name: "Commerce Platform", status: "ACTIVE" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
