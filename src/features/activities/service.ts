import "server-only";
import { prisma } from "@/lib/prisma";
import { getBugAccessContext, type BugActor } from "@/features/bugs/service";

export async function listBugActivities(bugId: string, actor: BugActor) {
  await getBugAccessContext(bugId, actor);
  return prisma.activityLog.findMany({ where: { bugId }, select: { id: true, actionType: true, fieldName: true, oldValue: true, newValue: true, description: true, metadata: true, createdAt: true, actor: { select: { id: true, fullName: true, username: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
}
