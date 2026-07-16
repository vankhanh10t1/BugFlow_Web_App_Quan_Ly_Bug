import { NotificationList } from "@/components/notifications/notification-list";
export const metadata = { title: "Notifications" };
export default function NotificationsPage() { return <div className="mx-auto max-w-3xl"><p className="text-sm font-medium text-blue-600">Inbox</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Notifications</h1><p className="mb-8 mt-2 text-slate-600">Assignments, status changes, comments, and mentions.</p><NotificationList /></div>; }
