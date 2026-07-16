import { describe, expect, it } from "vitest";
import { canAccessProject, canManageProject, hasSystemRole } from "@/lib/permissions";

describe("role-based permissions", () => {
  it("allows administrators to manage every project", () => {
    expect(canManageProject("ADMIN")).toBe(true);
    expect(hasSystemRole("ADMIN", ["ADMIN"])).toBe(true);
  });

  it("requires membership for ordinary project access", () => {
    expect(canAccessProject("DEVELOPER")).toBe(false);
    expect(canAccessProject("DEVELOPER", "DEVELOPER")).toBe(true);
    expect(canManageProject("DEVELOPER", "VIEWER")).toBe(false);
  });
});
