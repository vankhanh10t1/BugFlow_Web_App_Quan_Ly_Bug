import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { bugQuerySchema } from "@/lib/validators/bug";
import { getProject } from "@/features/projects/service";
import { listProjectBoard } from "@/features/boards/service";
import { listTriageMetadata } from "@/features/bugs/service";
import { KanbanBoard } from "@/components/boards/kanban-board";
const scalar = (value: string | string[] | undefined) => typeof value === "string" && value ? value : undefined;

export default async function ProjectBoardPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePageUser(); const { projectId } = await params; const raw = await searchParams;
  const query = bugQuerySchema.parse(Object.fromEntries(Object.entries(raw).map(([key,value]) => [key, scalar(value)]).filter(([,value]) => value !== undefined)));
  const [project, bugs, metadata] = await Promise.all([getProject(projectId, actor), listProjectBoard(projectId, actor, query), listTriageMetadata(actor, projectId)]);
  const people = project.members.filter((member) => member.role === "DEVELOPER").map((member) => member.user);
  return <><Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-slate-500"><ArrowLeft className="size-4" />Dự án</Link><div className="mt-5"><p className="font-mono text-sm font-semibold text-blue-600">{project.code}</p><h1 className="mt-1 text-3xl font-semibold">Bảng Kanban</h1><p className="mt-2 text-slate-600">Kéo lỗi qua các bước chuyển trạng thái hợp lệ.</p></div><form className="mt-6 grid gap-3 rounded-xl border bg-white p-3 sm:grid-cols-2 lg:grid-cols-4"><Select name="assigneeId" value={query.assigneeId} label="Tất cả người phụ trách" options={people.map((x) => [x.id,x.fullName])} /><Select name="priority" value={query.priority} label="Tất cả độ ưu tiên" options={["LOW","MEDIUM","HIGH","URGENT"].map((x) => [x,x])} /><Select name="deadline" value={query.deadline} label="Mọi deadline" options={[["today","Hôm nay"],["next7days","7 ngày tới"],["overdue","Quá hạn"],["none","Không có deadline"]]} /><Select name="labelId" value={query.labelId} label="Tất cả nhãn" options={metadata.labels.map((x) => [x.id,x.name])} /><Select name="componentId" value={query.componentId} label="Tất cả thành phần" options={metadata.components.map((x) => [x.id,x.name])} /><Select name="versionId" value={query.versionId} label="Tất cả phiên bản" options={metadata.versions.map((x) => [x.id,x.name])} /><label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" name="unassigned" value="true" defaultChecked={query.unassigned} />Chưa phân công</label><button className="h-10 rounded-lg bg-slate-900 px-4 text-sm text-white">Áp dụng</button></form><KanbanBoard initialBugs={bugs} /></>;
}
function Select({ name, value, label, options }: { name: string; value?: string; label: string; options: string[][] }) { return <select name={name} defaultValue={value ?? ""} className="h-10 rounded-lg border bg-white px-3 text-sm"><option value="">{label}</option>{options.map(([id,text]) => <option key={id} value={id}>{text}</option>)}</select>; }
