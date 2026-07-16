import "server-only";
import type { BugPriority, BugSeverity, BugStatus, SystemRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { canAccessProject } from "@/lib/permissions";

export type DashboardActor = { id: string; systemRole: SystemRole };
const closedStatuses: BugStatus[] = ["CLOSED", "REJECTED", "DUPLICATE"];
const statusOrder: BugStatus[] = ["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "READY_FOR_TEST", "REOPENED", "CLOSED", "REJECTED", "DUPLICATE"];
const priorityOrder: BugPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const severityOrder: BugSeverity[] = ["MINOR", "MAJOR", "CRITICAL", "BLOCKER"];

function fill<T extends string>(order: readonly T[], rows: { key: T; count: number }[]) { const values = new Map(rows.map((row) => [row.key, row.count])); return order.map((name) => ({ name, value: values.get(name) ?? 0 })); }
function dayKey(date: Date) { return date.toISOString().slice(0, 10); }
function lastDays(days: number) { const result: string[] = []; const today = new Date(); today.setUTCHours(0, 0, 0, 0); for (let offset = days - 1; offset >= 0; offset--) { const date = new Date(today); date.setUTCDate(today.getUTCDate() - offset); result.push(dayKey(date)); } return result; }

export async function getOverviewDashboard(actor: DashboardActor) {
  const projectWhere = actor.systemRole === "ADMIN" ? {} : { members: { some: { userId: actor.id } } };
  const bugWhere = { deletedAt: null, ...(actor.systemRole === "ADMIN" ? {} : { project: projectWhere }) };
  const projects = await prisma.project.count({ where: projectWhere });
  const totalBugs = await prisma.bug.count({ where: bugWhere });
  const statusGroups = await prisma.bug.groupBy({ by: ["status"], where: bugWhere, _count: { _all: true } });
  const severityGroups = await prisma.bug.groupBy({ by: ["severity"], where: bugWhere, _count: { _all: true } });
  const overdue = await prisma.bug.count({ where: { ...bugWhere, dueDate: { lt: new Date() }, status: { notIn: closedStatuses } } });
  const statusCount = new Map(statusGroups.map((row) => [row.status, row._count._all]));
  const severityCount = new Map(severityGroups.map((row) => [row.severity, row._count._all]));
  const closed = statusCount.get("CLOSED") ?? 0;
  return { projects, totalBugs, openBugs: totalBugs - closed - (statusCount.get("REJECTED") ?? 0) - (statusCount.get("DUPLICATE") ?? 0), closedBugs: closed, overdueBugs: overdue, criticalBugs: severityCount.get("CRITICAL") ?? 0, blockerBugs: severityCount.get("BLOCKER") ?? 0 };
}

async function assertProject(projectId: string, actor: DashboardActor) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, code: true, name: true } });
  if (!project) throw new AppError("RESOURCE_NOT_FOUND", "Project not found", 404);
  if (actor.systemRole !== "ADMIN") { const membership = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: actor.id } }, select: { role: true } }); if (!canAccessProject(actor.systemRole, membership?.role)) throw new AppError("FORBIDDEN", "You do not have access to this project", 403); }
  return project;
}

export async function getProjectDashboard(projectId: string, actor: DashboardActor) {
  const project = await assertProject(projectId, actor);
  const where = { projectId, deletedAt: null };
  const totalBugs = await prisma.bug.count({ where });
  const statuses = await prisma.bug.groupBy({ by: ["status"], where, _count: { _all: true } });
  const priorities = await prisma.bug.groupBy({ by: ["priority"], where, _count: { _all: true } });
  const severities = await prisma.bug.groupBy({ by: ["severity"], where, _count: { _all: true } });
  const assignees = await prisma.bug.groupBy({ by: ["assigneeId"], where, _count: { _all: true }, orderBy: { _count: { assigneeId: "desc" } }, take: 10 });
  const assigneeIds = assignees.flatMap((row) => row.assigneeId ? [row.assigneeId] : []);
  const users = assigneeIds.length ? await prisma.user.findMany({ where: { id: { in: assigneeIds } }, select: { id: true, fullName: true } }) : [];
  const userNames = new Map(users.map((user) => [user.id, user.fullName]));
  const since = new Date(); since.setUTCDate(since.getUTCDate() - 29); since.setUTCHours(0, 0, 0, 0);
  const createdDates = await prisma.bug.findMany({ where: { ...where, createdAt: { gte: since } }, select: { createdAt: true } });
  const closedDates = await prisma.bug.findMany({ where: { ...where, closedAt: { gte: since } }, select: { closedAt: true } });
  const resolved = await prisma.bug.findMany({ where: { ...where, resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true } });
  const reopened = await prisma.activityLog.groupBy({ by: ["bugId"], where: { projectId, actionType: "STATUS_CHANGED", newValue: "REOPENED", bugId: { not: null } }, _count: { _all: true } });
  const createdMap = new Map<string, number>(); createdDates.forEach(({ createdAt }) => createdMap.set(dayKey(createdAt), (createdMap.get(dayKey(createdAt)) ?? 0) + 1));
  const closedMap = new Map<string, number>(); closedDates.forEach(({ closedAt }) => { if (closedAt) closedMap.set(dayKey(closedAt), (closedMap.get(dayKey(closedAt)) ?? 0) + 1); });
  const resolutionHours = resolved.flatMap(({ createdAt, resolvedAt }) => resolvedAt ? [(resolvedAt.getTime() - createdAt.getTime()) / 3_600_000] : []);
  return {
    project,
    summary: { totalBugs, reopenRate: totalBugs ? Number(((reopened.length / totalBugs) * 100).toFixed(1)) : 0, averageResolutionHours: resolutionHours.length ? Number((resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length).toFixed(1)) : 0 },
    byStatus: fill(statusOrder, statuses.map((row) => ({ key: row.status, count: row._count._all }))),
    byPriority: fill(priorityOrder, priorities.map((row) => ({ key: row.priority, count: row._count._all }))),
    bySeverity: fill(severityOrder, severities.map((row) => ({ key: row.severity, count: row._count._all }))),
    byAssignee: assignees.map((row) => ({ name: row.assigneeId ? userNames.get(row.assigneeId) ?? "Unknown" : "Unassigned", value: row._count._all })),
    daily: lastDays(30).map((date) => ({ date: date.slice(5), created: createdMap.get(date) ?? 0, closed: closedMap.get(date) ?? 0 })),
  };
}
