import "server-only";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function listNotifications(userId: string, page = 1, pageSize = 20) {
  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({ where: { recipientId: userId }, select: { id: true, type: true, title: true, message: true, isRead: true, readAt: true, createdAt: true, bug: { select: { id: true, bugCode: true } }, actor: { select: { id: true, fullName: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.notification.count({ where: { recipientId: userId } }),
    prisma.notification.count({ where: { recipientId: userId, isRead: false } }),
  ]);
  return { items, unreadCount, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } };
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, recipientId: userId }, select: { id: true } });
  if (!notification) throw new AppError("RESOURCE_NOT_FOUND", "Notification not found", 404);
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true, readAt: new Date() } });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { recipientId: userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
}
