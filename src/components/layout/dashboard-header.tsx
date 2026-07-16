import Link from "next/link";
import { Bug, BugIcon, FolderKanban, LayoutDashboard, ListTodo, LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/features/auth/actions";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function DashboardHeader({ name, role }: { name: string; role: string }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link href="/dashboard" className="mr-auto flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white"><Bug className="size-4" /></span>BugFlow</Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Dashboard navigation">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><LayoutDashboard className="size-4" />Dashboard</Link>
          <Link href="/projects" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><FolderKanban className="size-4" />Projects</Link>
          <Link href="/bugs" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><BugIcon className="size-4" />Bugs</Link>
          <Link href="/my-bugs" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><ListTodo className="size-4" />My bugs</Link>
          <Link href="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><UserRound className="size-4" />Profile</Link>
        </nav>
        <div className="hidden text-right md:block"><p className="text-sm font-medium">{name}</p><p className="text-[11px] text-slate-500">{role.replaceAll("_", " ")}</p></div>
        <NotificationBell />
        <form action={logoutAction}><button aria-label="Sign out" className="grid size-9 place-items-center rounded-lg border text-slate-500 hover:bg-slate-50 hover:text-slate-900"><LogOut className="size-4" /></button></form>
      </div>
    </header>
  );
}
