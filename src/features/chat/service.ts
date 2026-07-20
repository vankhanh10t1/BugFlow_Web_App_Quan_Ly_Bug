import "server-only";
import type { ChatConversationType, Prisma, ProjectRole, SystemRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

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
  return { projects: memberships.filter((item) => item.role !== "VIEWER").map((item) => item.project), directUsers, admins };
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
    ? { participants: { some: { userId: actor.id, leftAt: null } } }
    : { OR: [{ participants: { some: { userId: actor.id, leftAt: null } } }, { type: "PROJECT" as const, project: { members: { some: { userId: actor.id, user: { accountStatus: "ACTIVE" } } } } }] };
  const conversations = await prisma.chatConversation.findMany({
    where,
    select: {
      id: true, type: true, title: true, updatedAt: true,
      project: { select: { id: true, code: true, name: true } },
      participants: { where: { leftAt: null }, select: { userId: true, lastReadAt: true, user: { select: userSelect } } },
      messages: { where: { deletedAt: null }, select: { id: true, content: true, createdAt: true, senderId: true }, orderBy: { createdAt: "desc" }, take: 1 },
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
    return { ...conversation, displayName: conversation.project?.name ?? (conversation.type === "SUPPORT" ? conversation.title ?? "Hỗ trợ quản trị" : other?.fullName ?? "Hội thoại"), unreadCount, canSend: conversation.type !== "PROJECT" || actor.systemRole === "ADMIN" || projectMembership?.role !== "VIEWER" };
  }));
}

export async function getConversation(conversationId: string, actor: ChatActor) {
  await context(conversationId, actor);
  return prisma.chatConversation.findUnique({ where: { id: conversationId }, select: { id: true, type: true, title: true, project: { select: { id: true, code: true, name: true } }, participants: { where: { leftAt: null }, select: { user: { select: userSelect } } } } });
}

export async function listMessages(conversationId: string, actor: ChatActor, options: { cursor?: string; after?: Date; limit?: number }) {
  await context(conversationId, actor);
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  if (options.after) return prisma.chatMessage.findMany({ where: { conversationId, deletedAt: null, createdAt: { gt: options.after } }, select: { id: true, content: true, createdAt: true, sender: { select: userSelect } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: limit });
  const rows = await prisma.chatMessage.findMany({ where: { conversationId, deletedAt: null }, select: { id: true, content: true, createdAt: true, sender: { select: userSelect } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}), take: limit + 1 });
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).reverse();
  return { items, nextCursor: hasMore ? rows[limit - 1]?.id ?? null : null };
}

export async function sendMessage(conversationId: string, actor: ChatActor, content: string, clientId?: string) {
  const { conversation } = await context(conversationId, actor, true);
  return prisma.$transaction(async (tx) => {
    if (clientId) {
      const existing = await tx.chatMessage.findUnique({ where: { conversationId_clientId: { conversationId, clientId } }, select: { id: true, content: true, createdAt: true, sender: { select: userSelect } } });
      if (existing) return existing;
    }
    const message = await tx.chatMessage.create({ data: { conversationId, senderId: actor.id, content, clientId }, select: { id: true, content: true, createdAt: true, sender: { select: userSelect } } });
    await tx.chatConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    await tx.chatParticipant.upsert({ where: { conversationId_userId: { conversationId, userId: actor.id } }, create: { conversationId, userId: actor.id, lastReadAt: message.createdAt }, update: { lastReadAt: message.createdAt, leftAt: null } });
    const recipientIds = conversation.type === "PROJECT" && conversation.projectId
      ? (await tx.projectMember.findMany({ where: { projectId: conversation.projectId, userId: { not: actor.id }, user: { accountStatus: "ACTIVE" } }, select: { userId: true } })).map((item) => item.userId)
      : (await tx.chatParticipant.findMany({ where: { conversationId, userId: { not: actor.id }, leftAt: null, user: { accountStatus: "ACTIVE" } }, select: { userId: true } })).map((item) => item.userId);
    if (recipientIds.length) await tx.notification.createMany({ data: recipientIds.map((recipientId) => ({ recipientId, actorId: actor.id, conversationId, chatMessageId: message.id, type: "CHAT_MESSAGE" as const, title: "Tin nhắn mới", message: content.slice(0, 120) })) });
    return message;
  });
}

export async function markConversationRead(conversationId: string, actor: ChatActor) {
  await context(conversationId, actor);
  const now = new Date();
  return prisma.chatParticipant.upsert({ where: { conversationId_userId: { conversationId, userId: actor.id } }, create: { conversationId, userId: actor.id, lastReadAt: now }, update: { lastReadAt: now, leftAt: null } });
}
