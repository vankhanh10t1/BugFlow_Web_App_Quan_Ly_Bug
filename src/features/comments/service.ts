import "server-only";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { canManageProject } from "@/lib/permissions";
import { getBugAccessContext, type BugActor } from "@/features/bugs/service";
import type { CommentInput } from "@/lib/validators/comment";

const authorSelect = { id: true, fullName: true, username: true, avatarUrl: true } as const;
const usernames = (content: string) => [...new Set([...content.matchAll(/(^|\s)@([a-z0-9_]{3,30})\b/gi)].map((match) => match[2].toLowerCase()))];

export async function listComments(bugId: string, actor: BugActor) {
  await getBugAccessContext(bugId, actor);
  return prisma.comment.findMany({ where: { bugId, deletedAt: null }, select: { id: true, content: true, isEdited: true, createdAt: true, updatedAt: true, author: { select: authorSelect } }, orderBy: { createdAt: "asc" } });
}

export async function createComment(bugId: string, actor: BugActor, input: CommentInput) {
  const context = await getBugAccessContext(bugId, actor);
  const mentioned = usernames(input.content);
  const mentionedUsers = mentioned.length ? await prisma.user.findMany({ where: { username: { in: mentioned }, accountStatus: "ACTIVE", projectMemberships: { some: { projectId: context.bug.projectId } } }, select: { id: true, username: true } }) : [];
  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({ data: { bugId, authorId: actor.id, content: input.content }, select: { id: true, content: true, isEdited: true, createdAt: true, updatedAt: true, author: { select: authorSelect } } });
    await tx.activityLog.create({ data: { projectId: context.bug.projectId, bugId, actorId: actor.id, actionType: "COMMENT_ADDED", description: "Added a comment", metadata: { commentId: comment.id } } });
    const mentionIds = new Set(mentionedUsers.map((user) => user.id).filter((id) => id !== actor.id));
    const watchers = [context.bug.reporterId, context.bug.assigneeId].filter((id): id is string => id !== null).filter((id) => id !== actor.id && !mentionIds.has(id));
    const data = [
      ...[...mentionIds].map((recipientId) => ({ recipientId, actorId: actor.id, bugId, type: "MENTIONED" as const, title: "You were mentioned in a comment", message: input.content.slice(0, 180) })),
      ...[...new Set(watchers)].map((recipientId) => ({ recipientId, actorId: actor.id, bugId, type: "COMMENT_ADDED" as const, title: "New bug comment", message: input.content.slice(0, 180) })),
    ];
    if (data.length) await tx.notification.createMany({ data });
    return comment;
  });
}

async function commentContext(commentId: string, actor: BugActor) {
  const comment = await prisma.comment.findFirst({ where: { id: commentId, deletedAt: null }, select: { id: true, bugId: true, authorId: true, content: true } });
  if (!comment) throw new AppError("RESOURCE_NOT_FOUND", "Comment not found", 404);
  const access = await getBugAccessContext(comment.bugId, actor);
  return { comment, access };
}

export async function updateComment(commentId: string, actor: BugActor, input: CommentInput) {
  const context = await commentContext(commentId, actor);
  if (context.comment.authorId !== actor.id) throw new AppError("FORBIDDEN", "You can only edit your own comments", 403);
  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.update({ where: { id: commentId }, data: { content: input.content, isEdited: true }, select: { id: true, content: true, isEdited: true, createdAt: true, updatedAt: true, author: { select: authorSelect } } });
    await tx.activityLog.create({ data: { projectId: context.access.bug.projectId, bugId: context.comment.bugId, actorId: actor.id, actionType: "COMMENT_UPDATED", description: "Updated a comment", metadata: { commentId } } });
    return comment;
  });
}

export async function deleteComment(commentId: string, actor: BugActor) {
  const context = await commentContext(commentId, actor);
  const manager = canManageProject(actor.systemRole, context.access.role);
  if (context.comment.authorId !== actor.id && !manager) throw new AppError("FORBIDDEN", "You cannot delete this comment", 403);
  await prisma.$transaction(async (tx) => {
    await tx.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });
    await tx.activityLog.create({ data: { projectId: context.access.bug.projectId, bugId: context.comment.bugId, actorId: actor.id, actionType: "COMMENT_DELETED", description: "Deleted a comment", metadata: { commentId } } });
  });
}
