import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  projectFindMany: vi.fn(),
  memberFindMany: vi.fn(),
  userFindMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  project: { findMany: mocks.projectFindMany },
  projectMember: { findMany: mocks.memberFindMany },
  user: { findMany: mocks.userFindMany },
} }));

import { listChatCandidates } from "@/features/chat/service";
import { chatApiError } from "@/features/chat/api-error";
import { AppError } from "@/lib/errors";

describe("chat role and API errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.projectFindMany.mockResolvedValue([{ id: "project-1", code: "WEB", name: "Website" }]);
    mocks.memberFindMany.mockResolvedValue([]);
    mocks.userFindMany.mockResolvedValue([]);
  });

  it("lets ADMIN list active projects available for project chat", async () => {
    const result = await listChatCandidates({ id: "admin-1", systemRole: "ADMIN" });
    expect(result.projects).toEqual([{ id: "project-1", code: "WEB", name: "Website" }]);
    expect(mocks.projectFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: { not: "ARCHIVED" } } }));
    expect(result.directUsers).toEqual([]);
    expect(result.admins).toEqual([]);
  });

  it("preserves explicit authentication and permission status codes", async () => {
    const unauthorized = chatApiError(new AppError("UNAUTHORIZED", "Authentication required", 401), { step: "test" });
    const forbidden = chatApiError(new AppError("FORBIDDEN", "Bạn không có quyền truy cập hội thoại này", 403), { step: "test" });
    expect(unauthorized.status).toBe(401);
    expect(forbidden.status).toBe(403);
  });

  it("returns a friendly 503 when chat tables or columns are missing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = chatApiError(Object.assign(new Error("table does not exist"), { code: "P2021" }), {
      actor: { id: "tester-1", systemRole: "TESTER" },
      step: "list-conversations",
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ success: false, message: expect.stringContaining("migration") });
    expect(log).toHaveBeenCalledWith("[chat] request failed", expect.objectContaining({ userId: "tester-1", role: "TESTER", step: "list-conversations" }));
    log.mockRestore();
  });
});
