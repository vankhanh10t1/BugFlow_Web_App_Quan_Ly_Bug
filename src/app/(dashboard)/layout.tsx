import { requirePageUser } from "@/lib/auth";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { QueryProvider } from "@/components/providers/query-provider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return <QueryProvider><div className="min-h-screen bg-slate-50"><DashboardHeader name={user.fullName} role={user.systemRole} avatarUrl={user.avatarUrl} /><main className="mx-auto max-w-6xl px-6 py-10">{children}</main></div></QueryProvider>;
}
