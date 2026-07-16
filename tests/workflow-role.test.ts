import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/features/bugs/service", () => ({ getBugAccessContext: vi.fn() }));

let canActorTransition: typeof import("@/features/bugs/workflow-service").canActorTransition;
beforeAll(async () => { ({ canActorTransition } = await import("@/features/bugs/workflow-service")); });

const developer = { id: "developer-1", systemRole: "DEVELOPER" as const };
const tester = { id: "tester-1", systemRole: "TESTER" as const };

describe("role-aware bug workflow", () => {
  it("allows the assigned developer to progress implementation", () => {
    expect(canActorTransition("ASSIGNED", "IN_PROGRESS", developer, "DEVELOPER", developer.id)).toBe(true);
    expect(canActorTransition("IN_PROGRESS", "RESOLVED", developer, "DEVELOPER", developer.id)).toBe(true);
  });

  it("does not let another developer progress the bug", () => {
    expect(canActorTransition("ASSIGNED", "IN_PROGRESS", developer, "DEVELOPER", "developer-2")).toBe(false);
  });

  it("allows a tester to close or reopen only from ready for test", () => {
    expect(canActorTransition("READY_FOR_TEST", "CLOSED", tester, "TESTER", null)).toBe(true);
    expect(canActorTransition("READY_FOR_TEST", "REOPENED", tester, "TESTER", null)).toBe(true);
    expect(canActorTransition("ASSIGNED", "IN_PROGRESS", tester, "TESTER", null)).toBe(false);
  });
});
