import Link from "next/link";
import { NotificationList } from "@/components/notifications/notification-list";
export const metadata = { title: "Thông báo" };
export default function NotificationsPage() { return <div className="mx-auto max-w-3xl"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-blue-600">Hộp thư</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Thông báo</h1></div><Link href="/settings/notifications" className="rounded-lg border bg-white px-3 py-2 text-sm">Tùy chọn</Link></div><p className="mb-8 mt-2 text-slate-600">Phân công, deadline, hội thoại và các cập nhật quan trọng.</p><NotificationList /></div>; }
