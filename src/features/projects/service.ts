import "server-only";
import type { ProjectRole, SystemRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { canAccessProject, canCreateProject, canManageProject } from "@/lib/permissions";
import type { ProjectInput, ProjectQuery } from "@/lib/validators/project";

export type ProjectActor = { id: string; systemRole: SystemRole };

const memberUserSelect = { id: true, fullName: true, username: true, email: true, avatarUrl: true, systemRole: true, accountStatus: true } as const;

function dateOrNull(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

async function getProjectRole(projectId: string, actor: ProjectActor) {
  if (actor.systemRole === "ADMIN") return undefined;
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: actor.id } },
    select: { role: true },
  });
  return membership?.role;
}

async function assertProjectAccess(projectId: string, actor: ProjectActor, manage = false) {
  const exists = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!exists) throw new AppError("RESOURCE_NOT_FOUND", "Project not found", 404);
  const role = await getProjectRole(projectId, actor);
  const allowed = manage ? canManageProject(actor.systemRole, role) : canAccessProject(actor.systemRole, role);
  if (!allowed) throw new AppError("FORBIDDEN", "You do not have access to this project", 403);
  return role;
}

export async function listProjects(actor: ProjectActor, query: ProjectQuery) {
  const where = {
    ...(actor.systemRole === "ADMIN" ? {} : { members: { some: { userId: actor.id } } }),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" as const } }, { code: { contains: query.search, mode: "insensitive" as const } }] } : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      select: { id: true, code: true, name: true, description: true, status: true, startDate: true, expectedEndDate: true, createdAt: true, _count: { select: { members: true, bugs: true } } },
      orderBy: { updatedAt: "desc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
    }),
    prisma.project.count({ where }),
  ]);
  return { items, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) } };
}

export async function getProject(projectId: string, actor: ProjectActor) {
  const projectRole = await assertProjectAccess(projectId, actor);
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true, code: true, name: true, description: true, status: true, startDate: true, expectedEndDate: true, createdAt: true, updatedAt: true,
      createdBy: { select: memberUserSelect },
      members: { select: { id: true, role: true, createdAt: true, user: { select: memberUserSelect } }, orderBy: { createdAt: "asc" } },
      _count: { select: { bugs: true, activities: true } },
    },
  });
  if (!project) throw new AppError("RESOURCE_NOT_FOUND", "Project not found", 404);
  return { ...project, currentUserProjectRole: projectRole, canManage: canManageProject(actor.systemRole, projectRole) };
}

export async function createProject(actor: ProjectActor, input: ProjectInput) {
  if (!canCreateProject(actor.systemRole)) throw new AppError("FORBIDDEN", "Only administrators and project managers can create projects", 403);
  const existing = await prisma.project.findUnique({ where: { code: input.code }, select: { id: true } });
  if (existing) throw new AppError("DUPLICATE_RESOURCE", "Project code is already in use", 409);
  try {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({ data: { code: input.code, name: input.name, description: input.description || null, status: input.status, startDate: dateOrNull(input.startDate), expectedEndDate: dateOrNull(input.expectedEndDate), createdById: actor.id } });
      await tx.projectMember.create({ data: { projectId: project.id, userId: actor.id, role: "MANAGER" } });
      return project;
    });
  } catch {
    throw new AppError("DUPLICATE_RESOURCE", "Project code is already in use", 409);
  }
}

export async function updateProject(projectId: string, actor: ProjectActor, input: ProjectInput) {
  await assertProjectAccess(projectId, actor, true);
  const duplicate = await prisma.project.findFirst({ where: { code: input.code, NOT: { id: projectId } }, select: { id: true } });
  if (duplicate) throw new AppError("DUPLICATE_RESOURCE", "Project code is already in use", 409);
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.update({ where: { id: projectId }, data: { code: input.code, name: input.name, description: input.description || null, status: input.status, startDate: dateOrNull(input.startDate), expectedEndDate: dateOrNull(input.expectedEndDate) } });
    await tx.activityLog.create({ data: { projectId, actorId: actor.id, actionType: "PROJECT_UPDATED", description: "Updated project details", metadata: { code: input.code, status: input.status } } });
    return project;
  });
}

export async function archiveProject(projectId: string, actor: ProjectActor) {
  await assertProjectAccess(projectId, actor, true);
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.update({ where: { id: projectId }, data: { status: "ARCHIVED" } });
    await tx.activityLog.create({ data: { projectId, actorId: actor.id, actionType: "PROJECT_UPDATED", fieldName: "status", newValue: "ARCHIVED", description: "Archived the project" } });
    return project;
  });
}

export async function addProjectMember(projectId: string, actor: ProjectActor, userId: string, role: ProjectRole) {
  await assertProjectAccess(projectId, actor, true);
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } });
  if (!project) throw new AppError("RESOURCE_NOT_FOUND", "Project not found", 404);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, accountStatus: true } });
  if (!user || user.accountStatus !== "ACTIVE") throw new AppError("RESOURCE_NOT_FOUND", "Active user not found", 404);
  const existing = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } }, select: { id: true } });
  if (existing) throw new AppError("DUPLICATE_RESOURCE", "User is already a project member", 409);
  return prisma.$transaction(async (tx) => {
    const member = await tx.projectMember.create({ data: { projectId, userId, role }, select: { id: true, role: true, user: { select: memberUserSelect } } });
    await tx.activityLog.create({ data: { projectId, actorId: actor.id, actionType: "MEMBER_ADDED", newValue: userId, description: `Added a project member as ${role}`, metadata: { userId, role } } });
    await tx.notification.create({ data: { recipientId: userId, actorId: actor.id, projectId, type: "PROJECT_MEMBER_ADDED", title: "Bạn đã được thêm vào dự án", message: `Bạn đã được thêm vào dự án: ${project.name}` } });
    return member;
  });
}

export async function updateProjectMemberRole(projectId: string, memberId: string, actor: ProjectActor, role: ProjectRole) {
  await assertProjectAccess(projectId, actor, true);
  const member = await prisma.projectMember.findFirst({ where: { id: memberId, projectId }, select: { id: true, role: true } });
  if (!member) throw new AppError("RESOURCE_NOT_FOUND", "Project member not found", 404);
  if (member.role === "MANAGER" && role !== "MANAGER") {
    const managers = await prisma.projectMember.count({ where: { projectId, role: "MANAGER" } });
    if (managers <= 1) throw new AppError("VALIDATION_ERROR", "A project must have at least one manager", 400);
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.projectMember.update({ where: { id: memberId }, data: { role }, select: { id: true, role: true, user: { select: memberUserSelect } } });
    await tx.activityLog.create({ data: { projectId, actorId: actor.id, actionType: "PROJECT_UPDATED", fieldName: "memberRole", oldValue: member.role, newValue: role, description: "Updated a project member role", metadata: { memberId } } });
    return updated;
  });
}

export async function removeProjectMember(projectId: string, memberId: string, actor: ProjectActor) {
  await assertProjectAccess(projectId, actor, true);
  const member = await prisma.projectMember.findFirst({ where: { id: memberId, projectId }, select: { id: true, role: true } });
  if (!member) throw new AppError("RESOURCE_NOT_FOUND", "Project member not found", 404);
  if (member.role === "MANAGER") {
    const managers = await prisma.projectMember.count({ where: { projectId, role: "MANAGER" } });
    if (managers <= 1) throw new AppError("VALIDATION_ERROR", "The last project manager cannot be removed", 400);
  }
  await prisma.$transaction(async (tx) => {
    await tx.projectMember.delete({ where: { id: memberId } });
    await tx.activityLog.create({ data: { projectId, actorId: actor.id, actionType: "MEMBER_REMOVED", oldValue: memberId, description: "Removed a project member" } });
  });
}

export async function listAvailableUsers(projectId: string, actor: ProjectActor) {
  await assertProjectAccess(projectId, actor, true);
  return prisma.user.findMany({
    where: { accountStatus: "ACTIVE", projectMemberships: { none: { projectId } } },
    select: memberUserSelect, orderBy: { fullName: "asc" }, take: 100,
  });
}
