import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireActiveUser: vi.fn(),
  listConversations: vi.fn(),
  listChatCandidates: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireActiveUser: mocks.requireActiveUser }));
vi.mock("@/features/chat/service", () => ({
  listConversations: mocks.listConversations,
  listChatCandidates: mocks.listChatCandidates,
}));

import { GET } from "@/app/api/chat/init/route";

describe("GET /api/chat/init", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listConversations.mockResolvedValue([]);
    mocks.listChatCandidates.mockResolvedValue({ projects: [], directUsers: [], admins: [] });
  });

  it.each(["ADMIN", "TESTER"])("initializes an empty chat safely for %s", async (systemRole) => {
    mocks.requireActiveUser.mockResolvedValue({ id: `${systemRole.toLowerCase()}-1`, systemRole });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { currentUser: { systemRole }, conversations: [], candidates: { projects: [], directUsers: [], admins: [] } },
    });
  });

  it("returns 503 and logs the initialization step when chat schema is missing", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.requireActiveUser.mockResolvedValue({ id: "tester-1", systemRole: "TESTER" });
    mocks.listConversations.mockRejectedValue(Object.assign(new Error("relation does not exist"), { code: "P2021" }));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(log).toHaveBeenCalledWith("[chat:init] failed", expect.objectContaining({ userId: "tester-1", role: "TESTER", step: "initialize" }));
    log.mockRestore();
  });
});
