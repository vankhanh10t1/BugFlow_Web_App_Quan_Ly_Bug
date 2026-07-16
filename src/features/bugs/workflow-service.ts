import "server-only";
import type { BugStatus, ProjectRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { canManageProject } from "@/lib/permissions";
import { BUG_STATUS_TRANSITIONS, canTransitionBugStatus } from "@/features/bugs/workflow";
import { getBugAccessContext, type BugActor } from "@/features/bugs/service";

export function canActorTransition(from: BugStatus, to: BugStatus, actor: BugActor, role: ProjectRole | undefined, assigneeId: string | null) {
  if (!canTransitionBugStatus(from, to)) return false;
  if (canManageProject(actor.systemRole, role)) return true;
  const assignedDeveloper = role === "DEVELOPER" && assigneeId === actor.id;
  if (assignedDeveloper && ((from === "ASSIGNED" && to === "IN_PROGRESS") || (from === "REOPENED" && to === "IN_PROGRESS") || (from === "IN_PROGRESS" && to === "RESOLVED") || (from === "RESOLVED" && to === "READY_FOR_TEST"))) return true;
  return role === "TESTER" && from === "READY_FOR_TEST" && (to === "CLOSED" || to === "REOPENED");
}

export async function getAllowedTransitions(bugId: string, actor: BugActor) {
  const context = await getBugAccessContext(bugId, actor);
  return BUG_STATUS_TRANSITIONS[context.bug.status].filter((status) => canActorTransition(context.bug.status, status, actor, context.role, context.bug.assigneeId));
}

export async function transitionBugStatus(bugId: string, actor: BugActor, status: BugStatus) {
  const context = await getBugAccessContext(bugId, actor);
  const from = context.bug.status;
  if (!canActorTransition(from, status, actor, context.role, context.bug.assigneeId)) throw new AppError("VALIDATION_ERROR", `Transition from ${from} to ${status} is not allowed for your role`, 400);
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const bug = await tx.bug.update({ where: { id: bugId }, data: { status, ...(status === "RESOLVED" ? { resolvedAt: now } : {}), ...(status === "CLOSED" ? { closedAt: now } : {}), ...(status === "REOPENED" ? { closedAt: null } : {}) }, select: { id: true, bugCode: true, title: true, reporterId: true, assigneeId: true, status: true } });
    await tx.activityLog.create({ data: { projectId: context.bug.projectId, bugId, actorId: actor.id, actionType: "STATUS_CHANGED", fieldName: "status", oldValue: from, newValue: status, description: `Changed status from ${from} to ${status}` } });
    const recipients = [...new Set([bug.reporterId, bug.assigneeId].filter((id): id is string => Boolean(id) && id !== actor.id))];
    if (recipients.length) await tx.notification.createMany({ data: recipients.map((recipientId) => ({ recipientId, actorId: actor.id, bugId, type: "STATUS_CHANGED" as const, title: `${bug.bugCode} status changed`, message: `${from.replaceAll("_", " ")} → ${status.replaceAll("_", " ")}` })) });
    return bug;
  });
}
