import type { ProjectRole, SystemRole } from "@/generated/prisma/client";

export function hasSystemRole(current: SystemRole, allowed: readonly SystemRole[]) {
  return allowed.includes(current);
}

export function canManageProject(systemRole: SystemRole, projectRole?: ProjectRole) {
  return systemRole === "ADMIN" || projectRole === "MANAGER";
}

export function canCreateProject(systemRole: SystemRole) {
  return systemRole === "ADMIN" || systemRole === "PROJECT_MANAGER";
}

export function canAccessProject(systemRole: SystemRole, projectRole?: ProjectRole) {
  return systemRole === "ADMIN" || Boolean(projectRole);
}
