import { describe, expect, it } from "vitest";
import { canAccessProject, canCreateProject, canManageProject, hasSystemRole } from "@/lib/permissions";

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

  it("lets system project managers create projects without granting access to unrelated projects", () => {
    expect(canCreateProject("PROJECT_MANAGER")).toBe(true);
    expect(canManageProject("PROJECT_MANAGER")).toBe(false);
    expect(canManageProject("PROJECT_MANAGER", "MANAGER")).toBe(true);
  });
});
