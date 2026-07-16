import { describe, expect, it } from "vitest";
import { projectInputSchema, projectQuerySchema } from "@/lib/validators/project";

describe("project validation", () => {
  it("normalizes a project code", () => {
    const project = projectInputSchema.parse({ code: " shop ", name: "Commerce Platform", status: "ACTIVE", startDate: "2026-07-01", expectedEndDate: "2026-08-01" });
    expect(project.code).toBe("SHOP");
  });

  it("rejects an end date before the start date", () => {
    expect(projectInputSchema.safeParse({ code: "SHOP", name: "Commerce Platform", startDate: "2026-08-01", expectedEndDate: "2026-07-01" }).success).toBe(false);
  });

  it("bounds server-side pagination", () => {
    expect(projectQuerySchema.safeParse({ page: 1, pageSize: 51 }).success).toBe(false);
  });
});
