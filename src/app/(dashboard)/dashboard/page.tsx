import { Bug, FolderKanban, ShieldCheck } from "lucide-react";
import { requirePageUser } from "@/lib/auth";

export const metadata = { title: "Dashboard" };
export default async function DashboardPage() {
  const user = await requirePageUser();
  const cards = [{ icon: FolderKanban, label: "Projects", value: "—", note: "Available in Phase 4" }, { icon: Bug, label: "Assigned bugs", value: "—", note: "Available in Phase 5" }, { icon: ShieldCheck, label: "System role", value: user.systemRole.replaceAll("_", " "), note: "Enforced on the server" }];
  return <><div><p className="text-sm font-medium text-blue-600">Overview</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Good to see you, {user.fullName.split(" ")[0]}</h1><p className="mt-2 text-slate-600">Your authenticated workspace is ready.</p></div><div className="mt-8 grid gap-4 md:grid-cols-3">{cards.map(({ icon: Icon, label, value, note }) => <article key={label} className="rounded-xl border bg-white p-5 shadow-sm"><Icon className="size-5 text-blue-600" /><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold capitalize">{value.toLowerCase()}</p><p className="mt-3 text-xs text-slate-400">{note}</p></article>)}</div></>;
}
