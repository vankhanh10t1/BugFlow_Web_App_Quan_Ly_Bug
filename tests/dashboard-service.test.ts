import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ projectCount: vi.fn(), projectFindUnique: vi.fn(), memberFindUnique: vi.fn(), bugCount: vi.fn(), bugGroupBy: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { project: { count: mocks.projectCount, findUnique: mocks.projectFindUnique }, projectMember: { findUnique: mocks.memberFindUnique }, bug: { count: mocks.bugCount, groupBy: mocks.bugGroupBy } } }));

import { getOverviewDashboard, getProjectDashboard } from "@/features/dashboard/service";

describe("dashboard service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aggregates overview metrics within the actor's accessible projects", async () => {
    mocks.projectCount.mockResolvedValue(2);
    mocks.bugCount.mockResolvedValueOnce(10).mockResolvedValueOnce(2);
    mocks.bugGroupBy.mockResolvedValueOnce([{ status: "CLOSED", _count: { _all: 3 } }, { status: "REJECTED", _count: { _all: 1 } }]).mockResolvedValueOnce([{ severity: "CRITICAL", _count: { _all: 2 } }, { severity: "BLOCKER", _count: { _all: 1 } }]);
    const result = await getOverviewDashboard({ id: "tester-1", systemRole: "TESTER" });
    expect(result).toMatchObject({ projects: 2, totalBugs: 10, openBugs: 6, closedBugs: 3, overdueBugs: 2, criticalBugs: 2, blockerBugs: 1 });
    expect(mocks.projectCount).toHaveBeenCalledWith({ where: { members: { some: { userId: "tester-1" } } } });
    expect(mocks.bugCount).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: expect.objectContaining({ project: { members: { some: { userId: "tester-1" } } } }) }));
  });

  it("blocks project dashboard access without membership", async () => {
    mocks.projectFindUnique.mockResolvedValue({ id: "project-1", code: "SHOP", name: "Shop" });
    mocks.memberFindUnique.mockResolvedValue(null);
    await expect(getProjectDashboard("project-1", { id: "outsider-1", systemRole: "DEVELOPER" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.bugCount).not.toHaveBeenCalled();
  });
});
