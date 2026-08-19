import "server-only";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { canManageProject } from "@/lib/permissions";
import { deleteAsset, uploadAsset } from "@/lib/cloudinary";
import { attachmentLimits, validateAttachment } from "@/lib/validators/attachment";
import { getBugAccessContext, type BugActor } from "@/features/bugs/service";

async function targetContext(bugId: string | null, commentId: string | null, actor: BugActor) {
  if ((bugId ? 1 : 0) + (commentId ? 1 : 0) !== 1) throw new AppError("VALIDATION_ERROR", "Choose one bug or comment target", 400);
  if (bugId) return { activityBugId: bugId, attachmentBugId: bugId, commentId: null, access: await getBugAccessContext(bugId, actor) };
  const comment = await prisma.comment.findFirst({ where: { id: commentId!, deletedAt: null }, select: { id: true, bugId: true } });
  if (!comment) throw new AppError("RESOURCE_NOT_FOUND", "Comment not found", 404);
  return { activityBugId: comment.bugId, attachmentBugId: null, commentId: comment.id, access: await getBugAccessContext(comment.bugId, actor) };
}

export async function listBugAttachments(bugId: string, actor: BugActor) {
  await getBugAccessContext(bugId, actor);
  const items = await prisma.attachment.findMany({ where: { bugId }, select: { id: true, originalFileName: true, mimeType: true, fileSize: true, type: true, uploadedById: true, createdAt: true, uploadedBy: { select: { fullName: true } } }, orderBy: { createdAt: "desc" } });
  return items.map((item) => ({ ...item, fileUrl: `/api/attachments/${item.id}` }));
}

export async function getAttachmentDownload(id: string, actor: BugActor) { const attachment = await prisma.attachment.findUnique({ where: { id }, select: { fileUrl: true, originalFileName: true, mimeType: true, type: true, bugId: true, comment: { select: { bugId: true } } } }); if (!attachment) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy tệp đính kèm", 404); const bugId = attachment.bugId ?? attachment.comment?.bugId; if (!bugId) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy đối tượng của tệp", 404); await getBugAccessContext(bugId, actor); return attachment; }

export async function createAttachment(file: File, bugId: string | null, commentId: string | null, actor: BugActor) {
  const target = await targetContext(bugId, commentId, actor);
  const config = await validateAttachment(file);
  const { maxFiles } = attachmentLimits();
  if (target.attachmentBugId) {
    const count = await prisma.attachment.count({ where: { bugId: target.attachmentBugId } });
    if (count >= maxFiles) throw new AppError("VALIDATION_ERROR", `Mỗi lỗi chỉ được có tối đa ${maxFiles} tệp đính kèm`, 400);
  }
  const uploaded = await uploadAsset(Buffer.from(await file.arrayBuffer()), config.fileName, config.resource);
  try {
    return await prisma.$transaction(async (tx) => {
      if (target.attachmentBugId) {
        const count = await tx.attachment.count({ where: { bugId: target.attachmentBugId } });
        if (count >= maxFiles) throw new AppError("VALIDATION_ERROR", `Mỗi lỗi chỉ được có tối đa ${maxFiles} tệp đính kèm`, 400);
      }
      const attachment = await tx.attachment.create({ data: { originalFileName: config.fileName, publicId: uploaded.publicId, fileUrl: uploaded.secureUrl, mimeType: config.mimeType, fileSize: file.size, type: config.type, uploadedById: actor.id, bugId: target.attachmentBugId, commentId: target.commentId } });
      await tx.activityLog.create({ data: { projectId: target.access.bug.projectId, bugId: target.activityBugId, actorId: actor.id, actionType: "ATTACHMENT_ADDED", description: `Attached ${file.name.slice(0, 120)}`, metadata: { attachmentId: attachment.id, commentId: target.commentId } } });
      return { ...attachment, fileUrl: `/api/attachments/${attachment.id}` };
    });
  } catch (error) {
    await deleteAsset(uploaded.publicId, config.resource).catch(() => undefined);
    throw error;
  }
}

export async function removeAttachment(id: string, actor: BugActor) {
  const attachment = await prisma.attachment.findUnique({ where: { id }, select: { id: true, publicId: true, type: true, uploadedById: true, originalFileName: true, bugId: true, comment: { select: { bugId: true } } } });
  if (!attachment) throw new AppError("RESOURCE_NOT_FOUND", "Attachment not found", 404);
  const bugId = attachment.bugId ?? attachment.comment?.bugId;
  if (!bugId) throw new AppError("RESOURCE_NOT_FOUND", "Attachment target not found", 404);
  const access = await getBugAccessContext(bugId, actor);
  if (attachment.uploadedById !== actor.id && !canManageProject(actor.systemRole, access.role)) throw new AppError("FORBIDDEN", "You cannot delete this attachment", 403);
  const resource = attachment.type === "IMAGE" ? "image" : attachment.type === "VIDEO" ? "video" : "raw";
  await deleteAsset(attachment.publicId, resource);
  await prisma.$transaction(async (tx) => {
    await tx.attachment.delete({ where: { id } });
    await tx.activityLog.create({ data: { projectId: access.bug.projectId, bugId, actorId: actor.id, actionType: "ATTACHMENT_DELETED", description: `Deleted attachment ${attachment.originalFileName}`, metadata: { attachmentId: id } } });
  });
}
