import { describe, expect, it } from "vitest";
import { assignBugSchema, bugInputSchema, bugQuerySchema } from "@/lib/validators/bug";

const validBug = { projectId: "project-1", title: "Checkout fails on Safari", description: "The checkout request fails after submitting payment.", priority: "HIGH", severity: "CRITICAL" };

describe("bug validation", () => {
  it("accepts a complete bug report", () => expect(bugInputSchema.safeParse(validBug).success).toBe(true));
  it("rejects a short title and description", () => expect(bugInputSchema.safeParse({ ...validBug, title: "Bug", description: "Fails" }).success).toBe(false));
  it("bounds pagination and normalizes unassignment", () => {
    expect(bugQuerySchema.safeParse({ pageSize: 51 }).success).toBe(false);
    expect(assignBugSchema.parse({ assigneeId: "" }).assigneeId).toBeNull();
  });
});
