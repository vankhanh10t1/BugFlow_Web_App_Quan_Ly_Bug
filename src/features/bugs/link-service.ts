import "server-only";
import type { BugLinkType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { canManageProject } from "@/lib/permissions";
import { getBugAccessContext, type BugActor } from "@/features/bugs/service";

const bugSelect = { id: true, bugCode: true, title: true, status: true, priority: true, project: { select: { id: true, code: true, name: true } } } as const;

function canEditSource(actor: BugActor, access: Awaited<ReturnType<typeof getBugAccessContext>>) {
  return canManageProject(actor.systemRole, access.role) || (access.bug.reporterId === actor.id && access.bug.status === "NEW");
}

async function assertEditableSource(bugId: string, actor: BugActor) {
  const access = await getBugAccessContext(bugId, actor);
  if (!canEditSource(actor, access)) throw new AppError("FORBIDDEN", "Bạn không có quyền chỉnh sửa bug nguồn", 403);
  return access;
}

export async function listBugLinks(bugId: string, actor: BugActor) {
  await getBugAccessContext(bugId, actor);
  const links = await prisma.bugLink.findMany({
    where: {
      OR: [{ sourceBugId: bugId }, { targetBugId: bugId }],
      sourceBug: { deletedAt: null, ...(actor.systemRole === "ADMIN" ? {} : { project: { members: { some: { userId: actor.id } } } }) },
      targetBug: { deletedAt: null, ...(actor.systemRole === "ADMIN" ? {} : { project: { members: { some: { userId: actor.id } } } }) },
    },
    select: { id: true, sourceBugId: true, targetBugId: true, type: true, createdAt: true, sourceBug: { select: bugSelect }, targetBug: { select: bugSelect } },
    orderBy: { createdAt: "desc" },
  });
  const sourceIds = [...new Set(links.map((link) => link.sourceBugId))];
  const editable = new Set<string>();
  for (const id of sourceIds) {
    const access = await getBugAccessContext(id, actor);
    if (canEditSource(actor, access)) editable.add(id);
  }
  return links.map((link) => ({ ...link, direction: link.sourceBugId === bugId ? "OUTGOING" as const : "INCOMING" as const, relatedBug: link.sourceBugId === bugId ? link.targetBug : link.sourceBug, canDelete: editable.has(link.sourceBugId) }));
}

async function assertNoBlockerCycle(sourceBugId: string, targetBugId: string) {
  const links = await prisma.bugLink.findMany({ where: { type: "BLOCKED_BY" }, select: { sourceBugId: true, targetBugId: true } });
  const next = new Map<string, string[]>();
  for (const link of links) next.set(link.sourceBugId, [...(next.get(link.sourceBugId) ?? []), link.targetBugId]);
  const pending = [targetBugId];
  const visited = new Set<string>();
  while (pending.length) {
    const id = pending.pop()!;
    if (id === sourceBugId) throw new AppError("VALIDATION_ERROR", "Liên kết này tạo vòng phụ thuộc BLOCKED_BY", 409);
    if (visited.has(id)) continue;
    visited.add(id);
    pending.push(...(next.get(id) ?? []));
  }
}

export async function createBugLink(sourceBugId: string, actor: BugActor, input: { targetBugId: string; type: BugLinkType }) {
  if (sourceBugId === input.targetBugId) throw new AppError("VALIDATION_ERROR", "Không thể liên kết bug với chính nó", 400);
  const source = await assertEditableSource(sourceBugId, actor);
  await getBugAccessContext(input.targetBugId, actor);
  const existing = await prisma.bugLink.findFirst({ where: { type: input.type, OR: [{ sourceBugId, targetBugId: input.targetBugId }, { sourceBugId: input.targetBugId, targetBugId: sourceBugId }] }, select: { id: true } });
  if (existing) throw new AppError("VALIDATION_ERROR", "Quan hệ tương đương giữa hai bug đã tồn tại", 409);
  if (input.type === "BLOCKED_BY") await assertNoBlockerCycle(sourceBugId, input.targetBugId);
  try {
    return await prisma.$transaction(async (tx) => {
      const link = await tx.bugLink.create({ data: { sourceBugId, targetBugId: input.targetBugId, type: input.type, createdById: actor.id }, select: { id: true, sourceBugId: true, targetBugId: true, type: true, createdAt: true } });
      await tx.activityLog.create({ data: { projectId: source.bug.projectId, bugId: sourceBugId, actorId: actor.id, actionType: "BUG_LINK_CREATED", description: "Đã tạo liên kết bug", metadata: { linkId: link.id, sourceBugId, targetBugId: input.targetBugId, type: input.type } } });
      return link;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") throw new AppError("VALIDATION_ERROR", "Liên kết bug đã tồn tại", 409);
    throw error;
  }
}

export async function deleteBugLink(contextBugId: string, linkId: string, actor: BugActor) {
  await getBugAccessContext(contextBugId, actor);
  const link = await prisma.bugLink.findUnique({ where: { id: linkId }, select: { id: true, sourceBugId: true, targetBugId: true, type: true } });
  if (!link || (link.sourceBugId !== contextBugId && link.targetBugId !== contextBugId)) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy liên kết bug", 404);
  const source = await assertEditableSource(link.sourceBugId, actor);
  await getBugAccessContext(link.targetBugId, actor);
  await prisma.$transaction(async (tx) => {
    await tx.bugLink.delete({ where: { id: link.id } });
    await tx.activityLog.create({ data: { projectId: source.bug.projectId, bugId: link.sourceBugId, actorId: actor.id, actionType: "BUG_LINK_DELETED", description: "Đã xóa liên kết bug", metadata: { linkId, sourceBugId: link.sourceBugId, targetBugId: link.targetBugId, type: link.type } } });
  });
  return { id: linkId };
}
