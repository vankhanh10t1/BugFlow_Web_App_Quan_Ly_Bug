import "server-only";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import type { NotificationType, Prisma } from "@/generated/prisma/client";

export const preferenceTypes = ["MENTIONED", "BUG_ASSIGNED", "STATUS_CHANGED", "BUG_DEADLINE_SOON", "BUG_OVERDUE", "PROJECT_MEMBER_ADDED", "CHAT_MESSAGE", "CHAT_REMINDER", "URGENT_MESSAGE", "SYSTEM_NOTIFICATION"] as const satisfies readonly NotificationType[];
export type PreferenceType = (typeof preferenceTypes)[number];
export type NotificationFilter = "all" | "unread" | "mention" | "deadline" | "chat" | "project" | "bug" | "urgent";

const filterTypes: Record<Exclude<NotificationFilter, "all" | "unread">, NotificationType[]> = {
  mention: ["MENTIONED"], deadline: ["BUG_DEADLINE_SOON", "DUE_DATE_APPROACHING", "BUG_OVERDUE"], chat: ["CHAT_MESSAGE", "CHAT_REMINDER"],
  project: ["PROJECT_MEMBER_ADDED"], bug: ["BUG_ASSIGNED", "BUG_UPDATED", "STATUS_CHANGED", "COMMENT_ADDED"], urgent: ["URGENT_MESSAGE", "SYSTEM_NOTIFICATION"],
};

function listWhere(userId: string, filter: NotificationFilter): Prisma.NotificationWhereInput {
  return { recipientId: userId, ...(filter === "unread" ? { isRead: false } : filter === "all" ? {} : { type: { in: filterTypes[filter] } }) };
}

export async function listNotifications(userId: string, page = 1, pageSize = 20, filter: NotificationFilter = "all") {
  const where = listWhere(userId, filter);
  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({ where, select: { id: true, type: true, title: true, message: true, isRead: true, readAt: true, createdAt: true, bug: { select: { id: true, bugCode: true } }, project: { select: { id: true, code: true, name: true } }, conversation: { select: { id: true } }, actor: { select: { id: true, fullName: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
  ]);
  return { items, unreadCount, filter, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
}

export async function getPreferences(userId: string) {
  const rows = await prisma.notificationPreference.findMany({ where: { userId }, select: { type: true, enabled: true } });
  const configured = new Map(rows.map((row) => [row.type, row.enabled]));
  return preferenceTypes.map((type) => ({ type, enabled: configured.get(type) ?? true }));
}

export async function updatePreferences(userId: string, values: Partial<Record<PreferenceType, boolean>>) {
  const entries = Object.entries(values).filter(([type, enabled]) => preferenceTypes.includes(type as PreferenceType) && typeof enabled === "boolean") as [PreferenceType, boolean][];
  if (!entries.length) throw new AppError("VALIDATION_ERROR", "Không có tùy chọn thông báo hợp lệ", 400);
  await prisma.$transaction(entries.map(([type, enabled]) => prisma.notificationPreference.upsert({ where: { userId_type: { userId, type } }, create: { userId, type, enabled }, update: { enabled } })));
  return getPreferences(userId);
}

type NotificationInput = Prisma.NotificationCreateManyInput & { priority?: "NORMAL" | "IMPORTANT" | "URGENT" };
export async function createNotifications(inputs: NotificationInput[], db: Prisma.TransactionClient | typeof prisma = prisma) {
  if (!inputs.length) return { count: 0 };
  const userIds = [...new Set(inputs.map((item) => item.recipientId))];
  const [preferences, mutes] = await Promise.all([
    db.notificationPreference?.findMany({ where: { userId: { in: userIds }, enabled: false }, select: { userId: true, type: true } }) ?? [],
    db.notificationMute?.findMany({ where: { userId: { in: userIds } }, select: { userId: true, targetType: true, targetId: true } }) ?? [],
  ]);
  const disabled = new Set(preferences.map((item) => `${item.userId}:${item.type}`));
  const muted = new Set(mutes.map((item) => `${item.userId}:${item.targetType}:${item.targetId}`));
  const allowed = inputs.filter((item) => {
    const urgent = item.priority === "URGENT" || item.type === "URGENT_MESSAGE" || item.type === "SYSTEM_NOTIFICATION";
    if (disabled.has(`${item.recipientId}:${item.type}`)) return false;
    if (urgent) return true;
    if (item.projectId && muted.has(`${item.recipientId}:PROJECT:${item.projectId}`)) return false;
    if (item.conversationId && muted.has(`${item.recipientId}:CONVERSATION:${item.conversationId}`)) return false;
    return true;
  }).map(({ priority: _priority, ...item }) => item);
  if (!allowed.length) return { count: 0 };
  if (allowed.length === 1 && !allowed[0]?.dedupeKey) { await db.notification.create({ data: allowed[0] }); return { count: 1 }; }
  return allowed.some((item) => item.dedupeKey) ? db.notification.createMany({ data: allowed, skipDuplicates: true }) : db.notification.createMany({ data: allowed });
}

export async function getMute(userId: string, targetType: "PROJECT" | "CONVERSATION", targetId: string) {
  return Boolean(await prisma.notificationMute.findUnique({ where: { userId_targetType_targetId: { userId, targetType, targetId } }, select: { id: true } }));
}

export async function setMute(userId: string, targetType: "PROJECT" | "CONVERSATION", targetId: string, muted: boolean) {
  if (muted) await prisma.notificationMute.upsert({ where: { userId_targetType_targetId: { userId, targetType, targetId } }, create: { userId, targetType, targetId }, update: {} });
  else await prisma.notificationMute.deleteMany({ where: { userId, targetType, targetId } });
  return { muted };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, recipientId: userId }, select: { id: true } });
  if (!notification) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy thông báo", 404);
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true, readAt: new Date() } });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { recipientId: userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
}
