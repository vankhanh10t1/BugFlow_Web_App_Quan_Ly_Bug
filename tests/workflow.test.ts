import { describe, expect, it } from "vitest";
import { canTransitionBugStatus } from "@/features/bugs/workflow";

describe("bug status workflow", () => {
  it("allows the documented happy path", () => {
    expect(canTransitionBugStatus("NEW", "ASSIGNED")).toBe(true);
    expect(canTransitionBugStatus("ASSIGNED", "IN_PROGRESS")).toBe(true);
    expect(canTransitionBugStatus("READY_FOR_TEST", "CLOSED")).toBe(true);
  });

  it("rejects arbitrary transitions", () => {
    expect(canTransitionBugStatus("NEW", "CLOSED")).toBe(false);
    expect(canTransitionBugStatus("IN_PROGRESS", "READY_FOR_TEST")).toBe(false);
    expect(canTransitionBugStatus("CLOSED", "REOPENED")).toBe(false);
  });
});
