import "server-only";
import type { BugPriority } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { canAccessProject } from "@/lib/permissions";
import type { BugActor } from "@/features/bugs/service";
export async function listProjectBoard(projectId: string, actor: BugActor, filters: { assigneeId?: string; priority?: BugPriority }) { const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } }); if (!project) throw new AppError("RESOURCE_NOT_FOUND", "Project not found", 404); const membership = actor.systemRole === "ADMIN" ? null : await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: actor.id } }, select: { role: true } }); if (!canAccessProject(actor.systemRole, membership?.role)) throw new AppError("FORBIDDEN", "You do not have access to this project", 403); return prisma.bug.findMany({ where: { projectId, deletedAt: null, ...(filters.assigneeId ? { assigneeId: filters.assigneeId } : {}), ...(filters.priority ? { priority: filters.priority } : {}) }, select: { id: true, bugCode: true, title: true, status: true, priority: true, dueDate: true, assignee: { select: { id: true, fullName: true } } }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }], take: 500 }); }
