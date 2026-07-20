import Link from "next/link";
import { Bug, BugIcon, FolderKanban, LayoutDashboard, ListTodo, LogOut, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ChatBadge } from "@/components/chat/chat-badge";
import { UserAvatar } from "@/components/users/user-avatar";
import { NavOverflowLabel } from "@/components/layout/nav-overflow-label";

const commonLinks = [{ href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard }, { href: "/projects", label: "Dự án", icon: FolderKanban }, { href: "/bugs", label: "Lỗi", icon: BugIcon }, { href: "/my-bugs", label: "Lỗi của tôi", icon: ListTodo }, { href: "/profile", label: "Hồ sơ", icon: UserRound }, { href: "/settings/security", label: "Bảo mật", icon: ShieldCheck }];

export function DashboardHeader({ name, role, avatarUrl }: { name: string; role: string; avatarUrl: string | null }) {
  const links = role === "ADMIN" ? [...commonLinks, { href: "/admin/users", label: "Quản lý người dùng", icon: UsersRound }] : commonLinks;
  return <header className="border-b bg-white"><div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6"><Link href="/dashboard" className="mr-auto flex shrink-0 items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white"><Bug className="size-4" /></span>BugFlow</Link><nav className="hidden min-w-0 items-center gap-1 sm:flex" aria-label="Điều hướng chính">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} title={label} className="flex min-w-0 max-w-36 shrink items-center gap-2 overflow-hidden rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><Icon className="size-4 shrink-0" /><NavOverflowLabel>{label}</NavOverflowLabel></Link>)}</nav><div className="flex shrink-0 items-center gap-2"><UserAvatar name={name} avatarUrl={avatarUrl} size="sm" /><div className="hidden text-right md:block"><p className="max-w-32 truncate text-sm font-medium">{name}</p><p className="text-[11px] text-slate-500">{role.replaceAll("_", " ")}</p></div></div><ChatBadge /><NotificationBell /><form action={logoutAction} className="shrink-0"><button aria-label="Đăng xuất" className="grid size-9 place-items-center rounded-lg border text-slate-500 hover:bg-slate-50 hover:text-slate-900"><LogOut className="size-4" /></button></form></div><nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto border-t px-3 py-2 sm:hidden" aria-label="Điều hướng di động">{links.map(({ href, label }) => <Link key={href} href={href} className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-xs">{label}</Link>)}</nav></header>;
}
