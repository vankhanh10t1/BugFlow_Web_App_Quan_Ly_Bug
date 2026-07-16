import type { ProjectStatus } from "@/generated/prisma/client";

const styles: Record<ProjectStatus, string> = {
  PLANNING: "bg-violet-50 text-violet-700 ring-violet-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ON_HOLD: "bg-amber-50 text-amber-700 ring-amber-200",
  COMPLETED: "bg-blue-50 text-blue-700 ring-blue-200",
  ARCHIVED: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}>{status.replaceAll("_", " ")}</span>;
}
