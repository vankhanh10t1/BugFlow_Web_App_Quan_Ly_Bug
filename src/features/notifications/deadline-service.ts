import "server-only";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { createNotifications } from "@/features/notifications/service";

const OPEN_STATUSES = ["NEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "READY_FOR_TEST", "REOPENED"] as const;

async function processBug(bug: { id: string; bugCode: string; projectId: string; dueDate: Date | null; reporter: { id: string; accountStatus: string }; assignee: { id: string; accountStatus: string } | null }, overdue: boolean) {
  if (!bug.dueDate) return 0;
  const recipients = [...new Set([bug.reporter.accountStatus === "ACTIVE" ? bug.reporter.id : null, bug.assignee?.accountStatus === "ACTIVE" ? bug.assignee.id : null].filter((id): id is string => Boolean(id)))];
  const type = overdue ? "BUG_OVERDUE" as const : "BUG_DEADLINE_SOON" as const;
  const result = await createNotifications(recipients.map((recipientId) => ({ recipientId, bugId: bug.id, ...(bug.projectId ? { projectId: bug.projectId } : {}), type, title: overdue ? "Lỗi đã quá hạn" : "Lỗi sắp tới hạn", message: `Bug ${bug.bugCode} ${overdue ? "đã quá hạn xử lý" : "sắp tới hạn xử lý"}.`, dedupeKey: `${overdue ? "overdue" : "deadline"}:${bug.id}:${bug.dueDate!.toISOString()}:${recipientId}` })));
  return result.count;
}

export async function createDeadlineNotifications(now = new Date(), windowHours = 24) {
  if (!Number.isFinite(windowHours) || windowHours <= 0 || windowHours > 168) throw new AppError("VALIDATION_ERROR", "Khoảng kiểm tra deadline không hợp lệ", 400);
  const cutoff = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
  const baseSelect = { id: true, bugCode: true, projectId: true, dueDate: true, reporter: { select: { id: true, accountStatus: true } }, assignee: { select: { id: true, accountStatus: true } } } as const;
  const [soon, overdue] = await Promise.all([
    prisma.bug.findMany({ where: { deletedAt: null, dueDate: { gt: now, lte: cutoff }, status: { in: [...OPEN_STATUSES] } }, select: baseSelect, orderBy: { dueDate: "asc" }, take: 1000 }),
    prisma.bug.findMany({ where: { deletedAt: null, dueDate: { lte: now }, status: { in: [...OPEN_STATUSES] } }, select: baseSelect, orderBy: { dueDate: "desc" }, take: 1000 }),
  ]);
  const validSoon = soon.filter((bug) => bug.dueDate && bug.dueDate > now && bug.dueDate <= cutoff);
  const validOverdue = overdue.filter((bug) => bug.dueDate && bug.dueDate <= now);
  let createdNotifications = 0; const errors: string[] = [];
  for (const [bug, isOverdue] of [...validSoon.map((bug) => [bug, false] as const), ...validOverdue.map((bug) => [bug, true] as const)]) {
    try { createdNotifications += await processBug(bug, isOverdue); }
    catch (error) { errors.push(`${bug.bugCode}: ${error instanceof Error ? error.message : "Lỗi không xác định"}`); }
  }
  return { scannedBugs: validSoon.length + validOverdue.length, soonBugs: validSoon.length, overdueBugs: validOverdue.length, createdNotifications, failedItems: errors.length, errors: errors.slice(0, 20), windowHours, checkedAt: now.toISOString(), cutoff: cutoff.toISOString() };
}

export async function createChatReminderNotifications(now = new Date()) {
  const reminders = await prisma.chatMessage.findMany({ where: { type: "REMINDER", reminderAt: { lte: now }, reminderSentAt: null, deletedAt: null, recalledAt: null }, select: { id: true, senderId: true, conversationId: true, content: true, reminderAt: true }, orderBy: { reminderAt: "asc" }, take: 1000 });
  let createdNotifications = 0; let processedReminders = 0; const errors: string[] = [];
  for (const reminder of reminders) {
    try {
      const result = await createNotifications([{ recipientId: reminder.senderId, conversationId: reminder.conversationId, chatMessageId: reminder.id, type: "CHAT_REMINDER", title: "Nhắc hẹn trong Chat", message: reminder.content.slice(0, 180), dedupeKey: `chat-reminder:${reminder.id}:${reminder.senderId}` }]);
      await prisma.chatMessage.updateMany({ where: { id: reminder.id, reminderSentAt: null, deletedAt: null, recalledAt: null }, data: { reminderSentAt: now } });
      createdNotifications += result.count; processedReminders += 1;
    } catch (error) { errors.push(`${reminder.id}: ${error instanceof Error ? error.message : "Lỗi không xác định"}`); }
  }
  return { scannedReminders: reminders.length, processedReminders, createdNotifications, failedItems: errors.length, errors: errors.slice(0, 20) };
}

export async function runScheduledNotificationWorker(now = new Date(), windowHours = 24) {
  const [deadlines, reminders] = await Promise.all([createDeadlineNotifications(now, windowHours), createChatReminderNotifications(now)]);
  return { checkedAt: now.toISOString(), deadlines, reminders, createdNotifications: deadlines.createdNotifications + reminders.createdNotifications, failedItems: deadlines.failedItems + reminders.failedItems };
}
