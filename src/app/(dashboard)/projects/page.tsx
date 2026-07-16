import Link from "next/link";
import { FolderKanban, Plus, Search } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { canCreateProject } from "@/lib/permissions";
import { projectQuerySchema } from "@/lib/validators/project";
import { listProjects } from "@/features/projects/service";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePageUser();
  const raw = await searchParams;
  const query = projectQuerySchema.parse({ search: typeof raw.search === "string" ? raw.search : undefined, status: typeof raw.status === "string" && raw.status ? raw.status : undefined, page: typeof raw.page === "string" ? raw.page : 1 });
  const result = await listProjects(actor, query);
  return <><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-blue-600">Workspace</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Projects</h1><p className="mt-2 text-slate-600">Projects you are authorized to access.</p></div>{canCreateProject(actor.systemRole) ? <Link href="/projects/new" className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white"><Plus className="size-4" />New project</Link> : null}</div>
    <form className="mt-8 flex flex-wrap gap-3 rounded-xl border bg-white p-3"><div className="relative min-w-64 flex-1"><Search className="absolute left-3 top-3 size-4 text-slate-400" /><input name="search" defaultValue={query.search} placeholder="Search name or code" className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm" /></div><select name="status" defaultValue={query.status ?? ""} className="h-10 rounded-lg border bg-white px-3 text-sm"><option value="">All statuses</option>{["PLANNING","ACTIVE","ON_HOLD","COMPLETED","ARCHIVED"].map((status) => <option key={status}>{status}</option>)}</select><button className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white">Apply filters</button></form>
    {result.items.length ? <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{result.items.map((project) => <Link key={project.id} href={`/projects/${project.id}`} className="group rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-4"><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold">{project.code}</span><ProjectStatusBadge status={project.status} /></div><h2 className="mt-5 font-semibold group-hover:text-blue-600">{project.name}</h2><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{project.description || "No description provided."}</p><div className="mt-5 flex gap-4 border-t pt-4 text-xs text-slate-500"><span>{project._count.members} members</span><span>{project._count.bugs} bugs</span></div></Link>)}</div> : <div className="mt-6 grid min-h-64 place-items-center rounded-xl border border-dashed bg-white text-center"><div><FolderKanban className="mx-auto size-8 text-slate-300" /><h2 className="mt-3 font-medium">No projects found</h2><p className="mt-1 text-sm text-slate-500">Adjust your filters or create the first project.</p></div></div>}
    <div className="mt-6 flex items-center justify-between text-sm text-slate-500"><span>{result.pagination.total} projects</span><div className="flex gap-2">{query.page > 1 ? <Link className="rounded-lg border bg-white px-3 py-2" href={{ query: { ...raw, page: query.page - 1 } }}>Previous</Link> : null}{query.page < result.pagination.totalPages ? <Link className="rounded-lg border bg-white px-3 py-2" href={{ query: { ...raw, page: query.page + 1 } }}>Next</Link> : null}</div></div></>;
}
