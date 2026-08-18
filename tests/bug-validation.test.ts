import { describe, expect, it } from "vitest";
import { assignBugSchema, bugInputSchema, bugQuerySchema, bulkBugSchema, quickEditBugSchema, savedViewSchema } from "@/lib/validators/bug";

const validBug = { projectId: "project-1", title: "Checkout fails on Safari", description: "The checkout request fails after submitting payment.", priority: "HIGH", severity: "CRITICAL" };

describe("bug validation", () => {
  it("accepts a complete bug report", () => expect(bugInputSchema.safeParse(validBug).success).toBe(true));
  it("rejects a short title and description", () => expect(bugInputSchema.safeParse({ ...validBug, title: "Bug", description: "Fails" }).success).toBe(false));
  it("bounds pagination and normalizes unassignment", () => {
    expect(bugQuerySchema.safeParse({ pageSize: 51 }).success).toBe(false);
    expect(assignBugSchema.parse({ assigneeId: "" }).assigneeId).toBeNull();
  });
  it("accepts workspace triage filters", () => {
    const query = bugQuerySchema.parse({ deadline: "next7days", unassigned: "true", labelId: "label-1", componentId: "component-1", versionId: "version-1" });
    expect(query.unassigned).toBe(true);
    expect(query.deadline).toBe("next7days");
  });
  it("validates saved views, quick edit and bounded bulk actions", () => {
    expect(savedViewSchema.safeParse({ name: "Triage tuần này", filters: { overdue: "true" } }).success).toBe(true);
    expect(quickEditBugSchema.safeParse({ dueDate: "2026-08-18" }).success).toBe(true);
    expect(quickEditBugSchema.safeParse({ priority: "HIGH", status: "NEW" }).success).toBe(false);
    expect(bulkBugSchema.safeParse({ bugIds: ["bug-1"], action: "priority", value: "URGENT" }).success).toBe(true);
  });
});
