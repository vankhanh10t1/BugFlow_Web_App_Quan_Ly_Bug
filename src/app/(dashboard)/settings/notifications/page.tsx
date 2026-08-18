import { NotificationPreferences } from "@/components/notifications/notification-preferences";
export const metadata = { title: "Cài đặt thông báo" };
export default function NotificationSettingsPage() { return <div className="mx-auto max-w-3xl"><p className="text-sm font-medium text-blue-600">Cài đặt</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Tùy chọn thông báo</h1><p className="mb-8 mt-2 text-slate-600">Chọn những cập nhật bạn muốn nhận. Thông báo khẩn cấp vẫn hiển thị khi dự án hoặc hội thoại bị tắt tiếng.</p><NotificationPreferences /></div>; }
