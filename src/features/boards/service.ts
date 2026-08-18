import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { canAccessProject } from "@/lib/permissions";
import type { BugActor } from "@/features/bugs/service";
import type { BugQuery } from "@/lib/validators/bug";
const terminal = ["RESOLVED", "CLOSED", "REJECTED", "DUPLICATE"] as const;
export async function listProjectBoard(projectId: string, actor: BugActor, filters: Pick<BugQuery, "assigneeId"|"priority"|"deadline"|"unassigned"|"labelId"|"componentId"|"versionId">) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }); if (!project) throw new AppError("RESOURCE_NOT_FOUND", "Project not found", 404);
  const membership = actor.systemRole === "ADMIN" ? null : await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: actor.id } }, select: { role: true } }); if (!canAccessProject(actor.systemRole, membership?.role)) throw new AppError("FORBIDDEN", "You do not have access to this project", 403);
  const now = new Date(); const start = new Date(now); start.setHours(0,0,0,0); const end = new Date(start); end.setDate(end.getDate() + (filters.deadline === "next7days" ? 8 : 1));
  const deadline: Prisma.BugWhereInput = filters.deadline === "none" ? { dueDate: null } : filters.deadline === "overdue" ? { dueDate: { lt: now }, status: { notIn: [...terminal] } } : filters.deadline ? { dueDate: { gte: start, lt: end } } : {};
  return prisma.bug.findMany({ where: { projectId, deletedAt: null, ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}), ...(filters.unassigned ? { assigneeId: null } : {}), ...(filters.priority ? { priority: filters.priority } : {}), ...(filters.labelId ? { labels: { some: { id: filters.labelId } } } : {}), ...(filters.componentId ? { componentId: filters.componentId } : {}), ...(filters.versionId ? { versionId: filters.versionId } : {}), ...deadline }, select: { id: true, bugCode: true, title: true, status: true, priority: true, dueDate: true, assignee: { select: { id: true, fullName: true } }, labels: { select: { id: true, name: true, color: true } }, component: { select: { id: true, name: true } }, version: { select: { id: true, name: true } } }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }], take: 500 });
}
