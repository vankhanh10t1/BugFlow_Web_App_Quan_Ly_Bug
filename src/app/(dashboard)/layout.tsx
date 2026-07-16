import { requirePageUser } from "@/lib/auth";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return <div className="min-h-screen bg-slate-50"><DashboardHeader name={user.fullName} role={user.systemRole} /><main className="mx-auto max-w-6xl px-6 py-10">{children}</main></div>;
}
