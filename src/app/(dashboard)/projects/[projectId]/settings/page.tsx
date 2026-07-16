import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { getProject, listAvailableUsers } from "@/features/projects/service";
import { addProjectMemberSchema } from "@/lib/validators/project";
import { ProjectForm } from "@/components/projects/project-form";
import { AddMemberForm } from "@/components/projects/add-member-form";
import { ArchiveProjectButton } from "@/components/projects/archive-project-button";
import { removeMemberAction, updateMemberRoleAction } from "@/features/projects/actions";
import { AppError } from "@/lib/errors";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const actor = await requirePageUser(); const { projectId } = await params; const project = await getProject(projectId, actor);
  if (!project.canManage) throw new AppError("FORBIDDEN", "Only project managers can access settings", 403);
  const users = await listAvailableUsers(projectId, actor);
  return <div className="mx-auto max-w-4xl"><Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-slate-500"><ChevronLeft className="size-4" />{project.name}</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight">Project settings</h1><p className="mb-8 mt-2 text-slate-600">Manage project details, access and lifecycle.</p>
    <section><h2 className="mb-4 text-lg font-semibold">General</h2><ProjectForm project={project} /></section>
    <section className="mt-10"><h2 className="mb-4 text-lg font-semibold">Members</h2><AddMemberForm projectId={projectId} users={users} /><div className="mt-4 divide-y rounded-xl border bg-white">{project.members.map((member) => <div key={member.id} className="flex flex-wrap items-center gap-3 p-4"><div className="min-w-48 flex-1"><p className="text-sm font-medium">{member.user.fullName}</p><p className="text-xs text-slate-500">{member.user.email}</p></div><form action={updateMemberRoleAction.bind(null, projectId, member.id)} className="flex gap-2"><select name="role" defaultValue={member.role} className="h-9 rounded-lg border bg-white px-2 text-xs">{addProjectMemberSchema.shape.role.options.map((role) => <option key={role}>{role}</option>)}</select><button className="h-9 rounded-lg border px-3 text-xs font-medium">Update</button></form><form action={removeMemberAction.bind(null, projectId, member.id)}><button aria-label={`Remove ${member.user.fullName}`} className="grid size-9 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button></form></div>)}</div></section>
    <section className="mt-10 rounded-xl border border-red-200 bg-red-50/40 p-6"><h2 className="font-semibold text-red-900">Danger zone</h2><p className="mb-4 mt-1 text-sm text-red-700">Archive the project when active work has ended.</p><ArchiveProjectButton projectId={projectId} /></section></div>;
}
