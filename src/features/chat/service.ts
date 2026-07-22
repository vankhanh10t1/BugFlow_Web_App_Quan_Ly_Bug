import "server-only";
import type { AttachmentType, ChatConversationType, ChatMessagePriority, ChatMessageType, Prisma, ProjectRole, SystemRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { deleteAsset, uploadAsset } from "@/lib/cloudinary";
import { validateAttachment } from "@/lib/validators/attachment";

export type ChatActor = { id: string; systemRole: SystemRole };
const userSelect = { id: true, fullName: true, username: true, avatarUrl: true, systemRole: true } as const;

async function context(conversationId: string, actor: ChatActor, write = false) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true, type: true, projectId: true, title: true,
      project: { select: { id: true, code: true, name: true, members: { where: { userId: actor.id }, select: { role: true, user: { select: { accountStatus: true } } } } } },
      participants: { where: { userId: actor.id, leftAt: null }, select: { id: true } },
    },
  });
  if (!conversation) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy hội thoại", 404);
  const participant = conversation.participants.length > 0;
  const membership = conversation.project?.members[0];
  const projectAccess = conversation.type === "PROJECT" && Boolean(membership?.user.accountStatus === "ACTIVE");
  if (!participant && !projectAccess) throw new AppError("FORBIDDEN", "Bạn không có quyền truy cập hội thoại này", 403);
  if (write && conversation.type === "PROJECT" && membership?.role === "VIEWER") throw new AppError("FORBIDDEN", "Thành viên chỉ xem không thể gửi tin nhắn", 403);
  if (projectAccess && !participant) {
    await prisma.chatParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId: actor.id } },
      create: { conversationId, userId: actor.id },
      update: { leftAt: null },
    });
  }
  return { conversation, role: membership?.role as ProjectRole | undefined };
}

export async function listChatCandidates(actor: ChatActor) {
  const memberships = actor.systemRole === "ADMIN" ? [] : await prisma.projectMember.findMany({
    where: { userId: actor.id, user: { accountStatus: "ACTIVE" }, project: { status: { not: "ARCHIVED" } } },
    select: { projectId: true, role: true, project: { select: { id: true, code: true, name: true } } },
    orderBy: { project: { name: "asc" } },
  });
  const projectIds = memberships.map((item) => item.projectId);
  const directUsers = projectIds.length ? await prisma.user.findMany({
    where: { id: { not: actor.id }, accountStatus: "ACTIVE", systemRole: { not: "ADMIN" }, projectMemberships: { some: { projectId: { in: projectIds } } } },
    select: userSelect, orderBy: { fullName: "asc" }, take: 100,
  }) : [];
  const admins = actor.systemRole === "ADMIN" ? [] : await prisma.user.findMany({
    where: { id: { not: actor.id }, accountStatus: "ACTIVE", systemRole: "ADMIN" },
    select: userSelect, orderBy: { fullName: "asc" }, take: 20,
  });
  const projects = actor.systemRole === "ADMIN"
    ? await prisma.project.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" },
      take: 100,
    })
    : memberships.filter((item) => item.role !== "VIEWER").map((item) => item.project);
  return { projects, directUsers, admins };
}

export async function createConversation(actor: ChatActor, input: { type: ChatConversationType; projectId?: string; targetUserId?: string }) {
  if (input.type === "PROJECT") {
    if (!input.projectId) throw new AppError("VALIDATION_ERROR", "Thiếu dự án", 400);
    const project = await prisma.project.findUnique({ where: { id: input.projectId }, select: { id: true, name: true, status: true, members: { where: { userId: actor.id }, select: { role: true } } } });
    const role = project?.members[0]?.role;
    if (!project || project.status === "ARCHIVED" || (actor.systemRole !== "ADMIN" && !role)) throw new AppError("FORBIDDEN", "Bạn không có quyền tạo chat dự án", 403);
    if (role === "VIEWER") throw new AppError("FORBIDDEN", "Thành viên chỉ xem không thể tạo chat dự án", 403);
    return prisma.$transaction(async (tx) => {
      const conversation = await tx.chatConversation.upsert({
        where: { projectId: project.id },
        create: { type: "PROJECT", projectId: project.id, title: project.name, createdById: actor.id },
        update: {},
      });
      await tx.chatParticipant.upsert({ where: { conversationId_userId: { conversationId: conversation.id, userId: actor.id } }, create: { conversationId: conversation.id, userId: actor.id }, update: { leftAt: null } });
      return conversation;
    });
  }

  if (!input.targetUserId || input.targetUserId === actor.id) throw new AppError("VALIDATION_ERROR", "Người nhận không hợp lệ", 400);
  const target = await prisma.user.findUnique({ where: { id: input.targetUserId }, select: { id: true, fullName: true, accountStatus: true, systemRole: true } });
  if (!target || target.accountStatus !== "ACTIVE") throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy người dùng đang hoạt động", 404);
  if (input.type === "SUPPORT") {
    if (actor.systemRole === "ADMIN" || target.systemRole !== "ADMIN") throw new AppError("FORBIDDEN", "Kênh hỗ trợ phải do người dùng mở với quản trị viên", 403);
  } else {
    if (target.systemRole === "ADMIN") throw new AppError("FORBIDDEN", "Hãy dùng kênh hỗ trợ để liên hệ quản trị viên", 403);
    const shared = await prisma.projectMember.findFirst({
      where: { userId: actor.id, project: { members: { some: { userId: target.id } } } }, select: { id: true },
    });
    if (!shared) throw new AppError("FORBIDDEN", "Chỉ có thể chat trực tiếp với người dùng có dự án chung", 403);
  }
  const pair = [actor.id, target.id].sort().join(":");
  const directKey = `${input.type.toLowerCase()}:${pair}`;
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.chatConversation.upsert({
      where: { directKey },
      create: { type: input.type, directKey, title: input.type === "SUPPORT" ? `Hỗ trợ · ${target.fullName}` : null, createdById: actor.id, participants: { create: [{ userId: actor.id }, { userId: target.id }] } },
      update: {},
    });
    await tx.chatParticipant.updateMany({ where: { conversationId: conversation.id, userId: { in: [actor.id, target.id] } }, data: { leftAt: null } });
    return conversation;
  });
}

export async function listConversations(actor: ChatActor) {
  const where: Prisma.ChatConversationWhereInput = actor.systemRole === "ADMIN"
    ? { participants: { some: { userId: actor.id, leftAt: null, hiddenAt: null } } }
    : { AND: [{ NOT: { participants: { some: { userId: actor.id, hiddenAt: { not: null } } } } }, { OR: [{ participants: { some: { userId: actor.id, leftAt: null } } }, { type: "PROJECT" as const, project: { members: { some: { userId: actor.id, user: { accountStatus: "ACTIVE" } } } } }] }] };
  const conversations = await prisma.chatConversation.findMany({
    where,
    select: {
      id: true, type: true, title: true, updatedAt: true,
      project: { select: { id: true, code: true, name: true } },
      participants: { where: { leftAt: null }, select: { userId: true, lastReadAt: true, user: { select: userSelect } } },
      messages: { where: { deletedAt: null, hiddenFor: { none: { userId: actor.id } } }, select: { id: true, content: true, type: true, recalledAt: true, createdAt: true, senderId: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" }, take: 100,
  });
  return Promise.all(conversations.map(async (conversation) => {
    let self = conversation.participants.find((item) => item.userId === actor.id);
    if (!self && conversation.type === "PROJECT") {
      const participant = await prisma.chatParticipant.upsert({ where: { conversationId_userId: { conversationId: conversation.id, userId: actor.id } }, create: { conversationId: conversation.id, userId: actor.id }, update: { leftAt: null }, select: { userId: true, lastReadAt: true, user: { select: userSelect } } });
      self = participant;
    }
    const unreadCount = await prisma.chatMessage.count({ where: { conversationId: conversation.id, deletedAt: null, senderId: { not: actor.id }, createdAt: { gt: self?.lastReadAt ?? new Date(0) } } });
    const projectMembership = conversation.project ? await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: conversation.project.id, userId: actor.id } }, select: { role: true } }) : null;
    const other = conversation.participants.find((item) => item.userId !== actor.id)?.user;
    const messages = conversation.messages.map((message) => ({ ...message, content: message.recalledAt ? "Tin nhắn đã được thu hồi" : message.content }));
    return { ...conversation, messages, displayName: conversation.project?.name ?? (conversation.type === "SUPPORT" ? conversation.title ?? "Hỗ trợ quản trị" : other?.fullName ?? "Hội thoại"), unreadCount, canSend: conversation.type !== "PROJECT" || actor.systemRole === "ADMIN" || projectMembership?.role !== "VIEWER" };
  }));
}

export async function getConversation(conversationId: string, actor: ChatActor) {
  await context(conversationId, actor);
  return prisma.chatConversation.findUnique({ where: { id: conversationId }, select: { id: true, type: true, title: true, project: { select: { id: true, code: true, name: true } }, participants: { where: { leftAt: null }, select: { user: { select: userSelect } } } } });
}

function messageSelect(actorId: string) {
  return {
    id: true, conversationId: true, senderId: true, clientId: true, content: true,
    type: true, priority: true, sticker: true, attachmentUrl: true, attachmentName: true,
    attachmentMime: true, attachmentSize: true, attachmentType: true, reminderAt: true,
    pinnedAt: true, recalledAt: true, createdAt: true, editedAt: true,
    sender: { select: userSelect }, marks: { where: { userId: actorId }, select: { id: true } },
  } as const;
}

type Receipt = { userId: string; lastDeliveredAt: Date | null; lastReadAt: Date | null };
function deliveryStatus(message: { senderId: string; createdAt: Date }, actor: ChatActor, receipts: Receipt[]) {
  if (message.senderId !== actor.id) return null;
  const recipients = receipts.filter((item) => item.userId !== actor.id);
  if (!recipients.length) return "SENT" as const;
  if (recipients.every((item) => item.lastReadAt && item.lastReadAt >= message.createdAt)) return "READ" as const;
  if (recipients.every((item) => item.lastDeliveredAt && item.lastDeliveredAt >= message.createdAt)) return "DELIVERED" as const;
  return "SENT" as const;
}

type MessageRow = {
  id: string; conversationId: string; senderId: string; clientId: string | null; content: string;
  type: ChatMessageType; priority: ChatMessagePriority; sticker: string | null;
  attachmentUrl: string | null; attachmentName: string | null; attachmentMime: string | null;
  attachmentSize: number | null; attachmentType: AttachmentType | null; reminderAt: Date | null;
  pinnedAt: Date | null; recalledAt: Date | null; createdAt: Date; editedAt: Date | null;
  sender: { id: string; fullName: string; username: string; avatarUrl: string | null; systemRole: SystemRole };
  marks: { id: string }[];
};

function visibleMessage(message: MessageRow) {
  return {
    ...message,
    content: message.recalledAt ? "Tin nhắn đã được thu hồi" : message.content,
    sticker: message.recalledAt ? null : message.sticker,
    attachmentUrl: message.recalledAt ? null : message.attachmentUrl,
    attachmentName: message.recalledAt ? null : message.attachmentName,
    attachmentMime: message.recalledAt ? null : message.attachmentMime,
    attachmentSize: message.recalledAt ? null : message.attachmentSize,
    attachmentType: message.recalledAt ? null : message.attachmentType,
    marked: message.marks.length > 0,
    marks: undefined,
  };
}

export async function listMessages(conversationId: string, actor: ChatActor, options: { cursor?: string; after?: Date; limit?: number }) {
  await context(conversationId, actor);
  const now = new Date();
  const participant = await prisma.chatParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId: actor.id } },
    create: { conversationId, userId: actor.id, lastDeliveredAt: now },
    update: { lastDeliveredAt: now, leftAt: null },
    select: { historyClearedAt: true, autoDeleteSeconds: true },
  });
  const autoDeleteCutoff = participant.autoDeleteSeconds ? new Date(now.getTime() - participant.autoDeleteSeconds * 1_000) : null;
  const cutoff = [participant.historyClearedAt, autoDeleteCutoff].filter((value): value is Date => Boolean(value)).sort((a, b) => b.getTime() - a.getTime())[0];
  const where: Prisma.ChatMessageWhereInput = { conversationId, deletedAt: null, hiddenFor: { none: { userId: actor.id } }, ...(cutoff ? { createdAt: { gt: cutoff } } : {}) };
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  const receipts = await prisma.chatParticipant.findMany({ where: { conversationId, leftAt: null }, select: { userId: true, lastDeliveredAt: true, lastReadAt: true } });
  if (options.after) {
    const rows = await prisma.chatMessage.findMany({ where: { ...where, createdAt: { ...(where.createdAt as Prisma.DateTimeFilter | undefined), gt: options.after } }, select: messageSelect(actor.id), orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: limit });
    return rows.map((message) => ({ ...visibleMessage(message), deliveryStatus: deliveryStatus(message, actor, receipts) }));
  }
  const rows = await prisma.chatMessage.findMany({ where, select: messageSelect(actor.id), orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}), take: limit + 1 });
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).reverse().map((message) => ({ ...visibleMessage(message), deliveryStatus: deliveryStatus(message, actor, receipts) }));
  return { items, nextCursor: hasMore ? rows[limit - 1]?.id ?? null : null };
}

export type SendChatMessageInput = { content: string; clientId?: string; type: "TEXT" | "EMOJI" | "STICKER" | "REMINDER"; priority: ChatMessagePriority; sticker?: string; reminderAt?: Date };
export async function sendMessage(conversationId: string, actor: ChatActor, input: SendChatMessageInput) {
  const { conversation } = await context(conversationId, actor, true);
  return prisma.$transaction(async (tx) => {
    if (input.clientId) {
      const existing = await tx.chatMessage.findUnique({ where: { conversationId_clientId: { conversationId, clientId: input.clientId } }, select: messageSelect(actor.id) });
      if (existing) return { ...visibleMessage(existing), deliveryStatus: "SENT" as const };
    }
    const message = await tx.chatMessage.create({ data: { conversationId, senderId: actor.id, content: input.content, clientId: input.clientId, type: input.type, priority: input.priority, sticker: input.sticker, reminderAt: input.reminderAt }, select: messageSelect(actor.id) });
    await tx.chatConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    await tx.chatParticipant.upsert({ where: { conversationId_userId: { conversationId, userId: actor.id } }, create: { conversationId, userId: actor.id, lastReadAt: message.createdAt, lastDeliveredAt: message.createdAt }, update: { lastReadAt: message.createdAt, lastDeliveredAt: message.createdAt, leftAt: null } });
    const recipientIds = conversation.type === "PROJECT" && conversation.projectId
      ? (await tx.projectMember.findMany({ where: { projectId: conversation.projectId, userId: { not: actor.id }, user: { accountStatus: "ACTIVE" } }, select: { userId: true } })).map((item) => item.userId)
      : (await tx.chatParticipant.findMany({ where: { conversationId, userId: { not: actor.id }, leftAt: null, user: { accountStatus: "ACTIVE" } }, select: { userId: true } })).map((item) => item.userId);
    const preview = input.type === "STICKER" ? "Đã gửi một sticker" : input.type === "REMINDER" ? `Nhắc hẹn: ${input.content}` : input.content;
    if (recipientIds.length) await tx.notification.createMany({ data: recipientIds.map((recipientId) => ({ recipientId, actorId: actor.id, conversationId, chatMessageId: message.id, type: "CHAT_MESSAGE" as const, title: input.priority === "URGENT" ? "Tin nhắn khẩn cấp" : "Tin nhắn mới", message: preview.slice(0, 120) })) });
    return { ...visibleMessage(message), deliveryStatus: "SENT" as const };
  });
}

export async function sendChatAttachment(conversationId: string, actor: ChatActor, file: File, priority: ChatMessagePriority, clientId?: string) {
  const { conversation } = await context(conversationId, actor, true);
  const config = validateAttachment(file);
  const uploaded = await uploadAsset(Buffer.from(await file.arrayBuffer()), file.name, config.resource);
  try {
    const type: ChatMessageType = config.type === "IMAGE" || config.type === "VIDEO" ? "IMAGE" : "FILE";
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.chatMessage.create({
        data: { conversationId, senderId: actor.id, clientId, content: file.name.slice(0, 255), type, priority, attachmentUrl: uploaded.secureUrl, attachmentPublicId: uploaded.publicId, attachmentName: file.name.slice(0, 255), attachmentMime: file.type || "application/octet-stream", attachmentSize: file.size, attachmentType: config.type },
        select: messageSelect(actor.id),
      });
      await tx.chatConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      await tx.chatParticipant.upsert({ where: { conversationId_userId: { conversationId, userId: actor.id } }, create: { conversationId, userId: actor.id, lastReadAt: created.createdAt, lastDeliveredAt: created.createdAt }, update: { lastReadAt: created.createdAt, lastDeliveredAt: created.createdAt, leftAt: null } });
      const recipientIds = conversation.type === "PROJECT" && conversation.projectId
        ? (await tx.projectMember.findMany({ where: { projectId: conversation.projectId, userId: { not: actor.id }, user: { accountStatus: "ACTIVE" } }, select: { userId: true } })).map((item) => item.userId)
        : (await tx.chatParticipant.findMany({ where: { conversationId, userId: { not: actor.id }, leftAt: null, user: { accountStatus: "ACTIVE" } }, select: { userId: true } })).map((item) => item.userId);
      if (recipientIds.length) await tx.notification.createMany({ data: recipientIds.map((recipientId) => ({ recipientId, actorId: actor.id, conversationId, chatMessageId: created.id, type: "CHAT_MESSAGE" as const, title: priority === "URGENT" ? "Tệp khẩn cấp" : "Tệp mới trong Chat", message: file.name.slice(0, 120) })) });
      return created;
    });
    return { ...visibleMessage(message), deliveryStatus: "SENT" as const };
  } catch (error) {
    await deleteAsset(uploaded.publicId, config.resource).catch(() => undefined);
    throw error;
  }
}

export async function actOnMessage(conversationId: string, messageId: string, actor: ChatActor, action: "PIN" | "UNPIN" | "MARK" | "UNMARK" | "RECALL" | "DELETE_FOR_ME") {
  await context(conversationId, actor, action === "PIN" || action === "UNPIN" || action === "RECALL");
  const message = await prisma.chatMessage.findFirst({ where: { id: messageId, conversationId, deletedAt: null }, select: { id: true, senderId: true } });
  if (!message) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy tin nhắn", 404);
  if (action === "RECALL") {
    if (message.senderId !== actor.id) throw new AppError("FORBIDDEN", "Chỉ người gửi mới có thể thu hồi tin nhắn", 403);
    return prisma.chatMessage.update({ where: { id: messageId }, data: { recalledAt: new Date(), recalledById: actor.id } });
  }
  if (action === "PIN" || action === "UNPIN") return prisma.chatMessage.update({ where: { id: messageId }, data: action === "PIN" ? { pinnedAt: new Date(), pinnedById: actor.id } : { pinnedAt: null, pinnedById: null } });
  if (action === "MARK") return prisma.chatMessageMark.upsert({ where: { messageId_userId: { messageId, userId: actor.id } }, create: { messageId, userId: actor.id }, update: {} });
  if (action === "UNMARK") return prisma.chatMessageMark.deleteMany({ where: { messageId, userId: actor.id } });
  return prisma.chatMessageHidden.upsert({ where: { messageId_userId: { messageId, userId: actor.id } }, create: { messageId, userId: actor.id }, update: {} });
}

export async function bulkMessageAction(conversationId: string, actor: ChatActor, messageIds: string[], action: "MARK" | "UNMARK" | "DELETE_FOR_ME") {
  await context(conversationId, actor);
  const valid = await prisma.chatMessage.findMany({ where: { id: { in: messageIds }, conversationId, deletedAt: null }, select: { id: true } });
  if (valid.length !== new Set(messageIds).size) throw new AppError("FORBIDDEN", "Có tin nhắn không thuộc hội thoại", 403);
  if (action === "UNMARK") return prisma.chatMessageMark.deleteMany({ where: { userId: actor.id, messageId: { in: messageIds } } });
  if (action === "MARK") return prisma.chatMessageMark.createMany({ data: messageIds.map((messageId) => ({ messageId, userId: actor.id })), skipDuplicates: true });
  return prisma.chatMessageHidden.createMany({ data: messageIds.map((messageId) => ({ messageId, userId: actor.id })), skipDuplicates: true });
}

export async function updateConversationSettings(conversationId: string, actor: ChatActor, input: { hidden?: boolean; clearHistory?: boolean; autoDeleteSeconds?: number }) {
  await context(conversationId, actor);
  const now = new Date();
  return prisma.chatParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId: actor.id } },
    create: { conversationId, userId: actor.id, hiddenAt: input.hidden ? now : null, historyClearedAt: input.clearHistory ? now : null, autoDeleteSeconds: input.autoDeleteSeconds || null },
    update: { ...(input.hidden !== undefined ? { hiddenAt: input.hidden ? now : null } : {}), ...(input.clearHistory ? { historyClearedAt: now } : {}), ...(input.autoDeleteSeconds !== undefined ? { autoDeleteSeconds: input.autoDeleteSeconds || null } : {}) },
  });
}

export async function reportConversation(conversationId: string, actor: ChatActor, reason: string) {
  await context(conversationId, actor);
  return prisma.chatReport.create({ data: { conversationId, reporterId: actor.id, reason } });
}

export async function getConversationInfo(conversationId: string, actor: ChatActor) {
  await context(conversationId, actor);
  const participant = await prisma.chatParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId: actor.id } }, select: { hiddenAt: true, historyClearedAt: true, autoDeleteSeconds: true } });
  const now = new Date();
  const autoDeleteCutoff = participant?.autoDeleteSeconds ? new Date(now.getTime() - participant.autoDeleteSeconds * 1_000) : null;
  const cutoff = [participant?.historyClearedAt, autoDeleteCutoff].filter((value): value is Date => Boolean(value)).sort((a, b) => b.getTime() - a.getTime())[0];
  const messages = await prisma.chatMessage.findMany({ where: { conversationId, deletedAt: null, recalledAt: null, hiddenFor: { none: { userId: actor.id } }, ...(cutoff ? { createdAt: { gt: cutoff } } : {}) }, select: { id: true, content: true, type: true, attachmentUrl: true, attachmentName: true, attachmentMime: true, attachmentSize: true, reminderAt: true, pinnedAt: true, createdAt: true, sender: { select: userSelect } }, orderBy: { createdAt: "desc" }, take: 500 });
  const urlPattern = /https?:\/\/[^\s<]+/giu;
  return {
    reminders: messages.filter((item) => item.type === "REMINDER"),
    media: messages.filter((item) => item.type === "IMAGE"),
    files: messages.filter((item) => item.type === "FILE"),
    links: messages.flatMap((item) => (item.content.match(urlPattern) ?? []).map((url) => ({ messageId: item.id, url, createdAt: item.createdAt }))),
    pinned: messages.filter((item) => item.pinnedAt),
    settings: { hidden: Boolean(participant?.hiddenAt), autoDeleteSeconds: participant?.autoDeleteSeconds ?? 0 },
  };
}

export async function markConversationRead(conversationId: string, actor: ChatActor) {
  await context(conversationId, actor);
  const now = new Date();
  return prisma.chatParticipant.upsert({ where: { conversationId_userId: { conversationId, userId: actor.id } }, create: { conversationId, userId: actor.id, lastReadAt: now, lastDeliveredAt: now }, update: { lastReadAt: now, lastDeliveredAt: now, leftAt: null } });
}
