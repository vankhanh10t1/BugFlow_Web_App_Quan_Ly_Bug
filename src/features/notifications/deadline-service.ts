import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export async function createDeadlineNotifications(now = new Date(), windowHours = 24) {
  if (!Number.isFinite(windowHours) || windowHours <= 0 || windowHours > 168) throw new AppError("VALIDATION_ERROR", "Khoảng kiểm tra deadline không hợp lệ", 400);
  const cutoff = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
  const bugs = await prisma.bug.findMany({
    where: { deletedAt: null, dueDate: { gt: now, lte: cutoff }, status: { notIn: ["CLOSED", "REJECTED", "DUPLICATE"] } },
    select: { id: true, bugCode: true, dueDate: true, reporter: { select: { id: true, accountStatus: true } }, assignee: { select: { id: true, accountStatus: true } } },
    orderBy: { dueDate: "asc" },
    take: 1000,
  });
  const notifications = bugs.flatMap((bug) => {
    if (!bug.dueDate) return [];
    const dueDate = bug.dueDate;
    const recipients = new Set([bug.reporter.accountStatus === "ACTIVE" ? bug.reporter.id : null, bug.assignee?.accountStatus === "ACTIVE" ? bug.assignee.id : null].filter((id): id is string => Boolean(id)));
    return [...recipients].map((recipientId) => ({ recipientId, bugId: bug.id, type: "BUG_DEADLINE_SOON" as const, title: "Lỗi sắp tới hạn", message: `Bug ${bug.bugCode} sắp tới hạn xử lý.`, dedupeKey: `deadline:${bug.id}:${dueDate.toISOString()}:${recipientId}` }));
  });
  const result = notifications.length ? await prisma.notification.createMany({ data: notifications, skipDuplicates: true }) : { count: 0 };
  return { scannedBugs: bugs.length, candidateNotifications: notifications.length, createdNotifications: result.count, windowHours, checkedAt: now.toISOString(), cutoff: cutoff.toISOString() };
}
