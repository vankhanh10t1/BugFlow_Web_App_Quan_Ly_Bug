import type { BugPriority, BugSeverity, BugStatus } from "@/generated/prisma/client";

const statusStyles: Record<BugStatus, string> = { NEW: "bg-slate-100 text-slate-700", ASSIGNED: "bg-cyan-50 text-cyan-700", IN_PROGRESS: "bg-blue-50 text-blue-700", RESOLVED: "bg-violet-50 text-violet-700", READY_FOR_TEST: "bg-amber-50 text-amber-700", REOPENED: "bg-orange-50 text-orange-700", CLOSED: "bg-emerald-50 text-emerald-700", REJECTED: "bg-red-50 text-red-700", DUPLICATE: "bg-zinc-100 text-zinc-600" };
const priorityStyles: Record<BugPriority, string> = { LOW: "text-slate-500", MEDIUM: "text-blue-600", HIGH: "text-orange-600", URGENT: "text-red-600" };
const severityStyles: Record<BugSeverity, string> = { MINOR: "text-slate-500", MAJOR: "text-amber-600", CRITICAL: "text-orange-700", BLOCKER: "text-red-700" };
const statusLabels: Record<BugStatus, string> = { NEW: "Mới", ASSIGNED: "Đã phân công", IN_PROGRESS: "Đang xử lý", RESOLVED: "Đã xử lý", READY_FOR_TEST: "Chờ kiểm thử", REOPENED: "Mở lại", CLOSED: "Đã đóng", REJECTED: "Từ chối", DUPLICATE: "Trùng lặp" };
const priorityLabels: Record<BugPriority, string> = { LOW: "Thấp", MEDIUM: "Trung bình", HIGH: "Cao", URGENT: "Khẩn cấp" };
const severityLabels: Record<BugSeverity, string> = { MINOR: "Nhẹ", MAJOR: "Lớn", CRITICAL: "Nghiêm trọng", BLOCKER: "Chặn hệ thống" };
export function StatusBadge({ value }: { value: BugStatus }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[value]}`}>{statusLabels[value]}</span>; }
export function PriorityLabel({ value }: { value: BugPriority }) { return <span className={`text-xs font-semibold ${priorityStyles[value]}`}>{priorityLabels[value]}</span>; }
export function SeverityLabel({ value }: { value: BugSeverity }) { return <span className={`text-xs font-semibold ${severityStyles[value]}`}>{severityLabels[value]}</span>; }
