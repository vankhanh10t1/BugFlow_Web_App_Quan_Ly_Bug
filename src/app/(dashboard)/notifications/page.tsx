import { NotificationList } from "@/components/notifications/notification-list";
export const metadata = { title: "Thông báo" };
export default function NotificationsPage() { return <div className="mx-auto max-w-3xl"><p className="text-sm font-medium text-blue-600">Hộp thư</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Thông báo</h1><p className="mb-8 mt-2 text-slate-600">Phân công, thay đổi trạng thái, bình luận và lượt nhắc tên.</p><NotificationList /></div>; }
