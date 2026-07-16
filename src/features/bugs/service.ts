import "server-only";
import type { BugPriority, BugSeverity, Prisma, ProjectRole, SystemRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { canAccessProject, canManageProject } from "@/lib/permissions";
import type { BugInput, BugQuery, BugUpdateInput } from "@/lib/validators/bug";

export type BugActor = { id: string; systemRole: SystemRole };
const personSelect = { id: true, fullName: true, username: true, avatarUrl: true, email: true } as const;

function dateOrNull(value?: string) { return value ? new Date(`${value}T23:59:59.999Z`) : null; }

async function projectRole(projectId: string, actor: BugActor): Promise<ProjectRole | undefined> {
  if (actor.systemRole === "ADMIN") return undefined;
  return (await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: actor.id } }, select: { role: true } }))?.role;
}

async function assertProjectAccess(projectId: string, actor: BugActor) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, status: true } });
  if (!project) throw new AppError("RESOURCE_NOT_FOUND", "Project not found", 404);
  const role = await projectRole(projectId, actor);
  if (!canAccessProject(actor.systemRole, role)) throw new AppError("FORBIDDEN", "You do not have access to this project", 403);
  return { project, role };
}

export async function getBugAccessContext(bugId: string, actor: BugActor) {
  const bug = await prisma.bug.findFirst({ where: { id: bugId, deletedAt: null }, select: { id: true, projectId: true, reporterId: true, assigneeId: true, status: true, priority: true, severity: true } });
  if (!bug) throw new AppError("RESOURCE_NOT_FOUND", "Bug not found", 404);
  const access = await assertProjectAccess(bug.projectId, actor);
  return { bug, ...access };
}

export async function listBugProjects(actor: BugActor) {
  return prisma.project.findMany({
    where: { status: { not: "ARCHIVED" }, ...(actor.systemRole === "ADMIN" ? {} : { members: { some: { userId: actor.id } } }) },
    select: { id: true, code: true, name: true }, orderBy: { name: "asc" }, take: 100,
  });
}

export async function listBugPeople(actor: BugActor) {
  return prisma.user.findMany({
    where: { accountStatus: "ACTIVE", ...(actor.systemRole === "ADMIN" ? {} : { projectMemberships: { some: { project: { members: { some: { userId: actor.id } } } } } }) },
    select: { id: true, fullName: true }, orderBy: { fullName: "asc" }, take: 200,
  });
}

export async function listReportableProjects(actor: BugActor) {
  return prisma.project.findMany({
    where: { status: { not: "ARCHIVED" }, ...(actor.systemRole === "ADMIN" ? {} : { members: { some: { userId: actor.id, role: { in: ["MANAGER", "TESTER"] } } } }) },
    select: { id: true, code: true, name: true }, orderBy: { name: "asc" }, take: 100,
  });
}

export async function listBugs(actor: BugActor, query: BugQuery & { mine?: boolean }) {
  const where: Prisma.BugWhereInput = {
    deletedAt: null,
    project: actor.systemRole === "ADMIN" ? undefined : { members: { some: { userId: actor.id } } },
    ...(query.mine ? { assigneeId: actor.id } : {}),
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.severity ? { severity: query.severity } : {}),
    ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
    ...(query.reporterId ? { reporterId: query.reporterId } : {}),
    ...(query.overdue ? { AND: [{ dueDate: { lt: new Date() } }, { status: { notIn: ["CLOSED", "REJECTED", "DUPLICATE"] } }] } : {}),
    ...(query.search ? { OR: [{ title: { contains: query.search, mode: "insensitive" } }, { bugCode: { contains: query.search, mode: "insensitive" } }] } : {}),
  };
  const orderBy = { [query.sortBy]: query.sortOrder } as Prisma.BugOrderByWithRelationInput;
  try {
    // These read-only queries do not need transaction isolation. Running them
    // sequentially also avoids a connection spike when a Neon compute wakes up.
    const items = await prisma.bug.findMany({ where, select: { id: true, bugCode: true, title: true, status: true, priority: true, severity: true, dueDate: true, createdAt: true, project: { select: { id: true, code: true, name: true } }, reporter: { select: personSelect }, assignee: { select: personSelect } }, orderBy, skip: (query.page - 1) * query.pageSize, take: query.pageSize });
    const total = await prisma.bug.count({ where });
    return { items, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.max(1, Math.ceil(total / query.pageSize)) } };
  } catch (error) {
    console.error("[bugs:list] Failed to load bug list", { actorId: actor.id, mine: Boolean(query.mine), page: query.page, error });
    throw error;
  }
}

export async function getBug(bugId: string, actor: BugActor) {
  const access = await getBugAccessContext(bugId, actor);
  const bug = await prisma.bug.findFirst({
    where: { id: bugId, deletedAt: null },
    select: { id: true, bugCode: true, title: true, description: true, reproductionSteps: true, expectedResult: true, actualResult: true, environment: true, browser: true, operatingSystem: true, applicationVersion: true, status: true, priority: true, severity: true, dueDate: true, resolvedAt: true, closedAt: true, createdAt: true, updatedAt: true, project: { select: { id: true, code: true, name: true } }, reporter: { select: personSelect }, assignee: { select: personSelect }, tester: { select: personSelect } },
  });
  if (!bug) throw new AppError("RESOURCE_NOT_FOUND", "Bug not found", 404);
  const canManage = canManageProject(actor.systemRole, access.role);
  return { ...bug, canManage, canEdit: canManage || (bug.reporter.id === actor.id && bug.status === "NEW"), canSelfAssign: access.role === "DEVELOPER" && !bug.assignee };
}

export async function createBug(actor: BugActor, input: BugInput) {
  const access = await assertProjectAccess(input.projectId, actor);
  if (access.project.status === "ARCHIVED") throw new AppError("VALIDATION_ERROR", "Cannot create bugs in an archived project", 400);
  if (actor.systemRole !== "ADMIN" && access.role !== "MANAGER" && access.role !== "TESTER") throw new AppError("FORBIDDEN", "Only project testers and managers can report bugs", 403);
  return prisma.$transaction(async (tx) => {
    const counter = await tx.project.update({ where: { id: input.projectId }, data: { nextBugNumber: { increment: 1 } }, select: { code: true, nextBugNumber: true } });
    const sequenceNumber = counter.nextBugNumber - 1;
    const bug = await tx.bug.create({ data: { projectId: input.projectId, sequenceNumber, bugCode: `${counter.code}-${String(sequenceNumber).padStart(3, "0")}`, title: input.title, description: input.description, reproductionSteps: input.reproductionSteps || null, expectedResult: input.expectedResult || null, actualResult: input.actualResult || null, environment: input.environment || null, browser: input.browser || null, operatingSystem: input.operatingSystem || null, applicationVersion: input.applicationVersion || null, priority: input.priority, severity: input.severity, reporterId: actor.id, testerId: access.role === "TESTER" ? actor.id : null, dueDate: dateOrNull(input.dueDate) } });
    await tx.activityLog.create({ data: { projectId: input.projectId, bugId: bug.id, actorId: actor.id, actionType: "BUG_CREATED", description: `Created ${bug.bugCode}` } });
    return bug;
  });
}

export async function updateBug(bugId: string, actor: BugActor, input: BugUpdateInput) {
  const access = await getBugAccessContext(bugId, actor);
  const canManage = canManageProject(actor.systemRole, access.role);
  if (!canManage && !(access.bug.reporterId === actor.id && access.bug.status === "NEW")) throw new AppError("FORBIDDEN", "You cannot edit this bug", 403);
  return prisma.$transaction(async (tx) => {
    const bug = await tx.bug.update({ where: { id: bugId }, data: { title: input.title, description: input.description, reproductionSteps: input.reproductionSteps || null, expectedResult: input.expectedResult || null, actualResult: input.actualResult || null, environment: input.environment || null, browser: input.browser || null, operatingSystem: input.operatingSystem || null, applicationVersion: input.applicationVersion || null, priority: input.priority, severity: input.severity, dueDate: dateOrNull(input.dueDate) } });
    await tx.activityLog.create({ data: { projectId: access.bug.projectId, bugId, actorId: actor.id, actionType: "BUG_UPDATED", description: `Updated ${bug.bugCode}` } });
    return bug;
  });
}

export async function listProjectDevelopers(projectId: string, actor: BugActor) {
  const access = await assertProjectAccess(projectId, actor);
  if (!canManageProject(actor.systemRole, access.role)) throw new AppError("FORBIDDEN", "Only project managers can assign bugs", 403);
  return prisma.projectMember.findMany({ where: { projectId, role: "DEVELOPER", user: { accountStatus: "ACTIVE" } }, select: { user: { select: personSelect } }, orderBy: { user: { fullName: "asc" } } });
}

export async function assignBug(bugId: string, actor: BugActor, assigneeId: string | null) {
  const access = await getBugAccessContext(bugId, actor);
  const canManage = canManageProject(actor.systemRole, access.role);
  const selfAssign = assigneeId === actor.id && !access.bug.assigneeId && access.role === "DEVELOPER";
  if (!canManage && !selfAssign) throw new AppError("FORBIDDEN", "You cannot assign this bug", 403);
  if (!assigneeId && access.bug.status !== "ASSIGNED") throw new AppError("VALIDATION_ERROR", "Only assigned bugs can be unassigned", 400);
  if (assigneeId) {
    const target = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: access.bug.projectId, userId: assigneeId } }, select: { role: true, user: { select: { accountStatus: true } } } });
    if (!target || target.role !== "DEVELOPER" || target.user.accountStatus !== "ACTIVE") throw new AppError("VALIDATION_ERROR", "Assignee must be an active developer in this project", 400);
  }
  return prisma.$transaction(async (tx) => {
    const status = assigneeId && access.bug.status === "NEW" ? "ASSIGNED" : !assigneeId ? "NEW" : access.bug.status;
    const bug = await tx.bug.update({ where: { id: bugId }, data: { assigneeId, status } });
    await tx.activityLog.create({ data: { projectId: access.bug.projectId, bugId, actorId: actor.id, actionType: "ASSIGNEE_CHANGED", fieldName: "assigneeId", oldValue: access.bug.assigneeId, newValue: assigneeId, description: assigneeId ? "Assigned the bug" : "Unassigned the bug", metadata: { previousStatus: access.bug.status, status } } });
    if (assigneeId) await tx.notification.create({ data: { recipientId: assigneeId, actorId: actor.id, bugId, type: "BUG_ASSIGNED", title: `${bug.bugCode} assigned to you`, message: bug.title } });
    return bug;
  });
}

export async function updateBugPriority(bugId: string, actor: BugActor, priority: BugPriority) {
  const access = await getBugAccessContext(bugId, actor); if (!canManageProject(actor.systemRole, access.role)) throw new AppError("FORBIDDEN", "Only project managers can change priority", 403);
  return prisma.$transaction(async (tx) => { const bug = await tx.bug.update({ where: { id: bugId }, data: { priority } }); await tx.activityLog.create({ data: { projectId: access.bug.projectId, bugId, actorId: actor.id, actionType: "PRIORITY_CHANGED", fieldName: "priority", oldValue: access.bug.priority, newValue: priority, description: "Changed bug priority" } }); return bug; });
}

export async function updateBugSeverity(bugId: string, actor: BugActor, severity: BugSeverity) {
  const access = await getBugAccessContext(bugId, actor); if (!canManageProject(actor.systemRole, access.role)) throw new AppError("FORBIDDEN", "Only project managers can change severity", 403);
  return prisma.$transaction(async (tx) => { const bug = await tx.bug.update({ where: { id: bugId }, data: { severity } }); await tx.activityLog.create({ data: { projectId: access.bug.projectId, bugId, actorId: actor.id, actionType: "SEVERITY_CHANGED", fieldName: "severity", oldValue: access.bug.severity, newValue: severity, description: "Changed bug severity" } }); return bug; });
}
