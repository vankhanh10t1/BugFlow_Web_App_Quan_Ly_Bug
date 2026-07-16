"use client";

import { useActionState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { createProjectAction, type ProjectActionState, updateProjectAction } from "@/features/projects/actions";

type ProjectDefaults = { id: string; code: string; name: string; description: string | null; status: string; startDate: Date | null; expectedEndDate: Date | null };
const dateValue = (date: Date | null | undefined) => date ? new Date(date).toISOString().slice(0, 10) : "";

export function ProjectForm({ project }: { project?: ProjectDefaults }) {
  const update = project ? updateProjectAction.bind(null, project.id) : null;
  const action = update ?? createProjectAction;
  const [state, formAction, pending] = useActionState<ProjectActionState, FormData>(action, undefined);
  return (
    <form action={formAction} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField id="code" name="code" label="Project code" placeholder="SHOP" defaultValue={project?.code} error={state?.fieldErrors?.code} required />
        <AuthField id="name" name="name" label="Project name" placeholder="Commerce Platform" defaultValue={project?.name} error={state?.fieldErrors?.name} required />
      </div>
      <div className="space-y-1.5"><label htmlFor="description" className="text-sm font-medium text-slate-700">Description</label><textarea id="description" name="description" rows={5} defaultValue={project?.description ?? ""} className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5"><label htmlFor="status" className="text-sm font-medium text-slate-700">Status</label><select id="status" name="status" defaultValue={project?.status ?? "PLANNING"} className="h-11 w-full rounded-lg border bg-white px-3 text-sm">{["PLANNING","ACTIVE","ON_HOLD","COMPLETED","ARCHIVED"].map((status) => <option key={status}>{status}</option>)}</select></div>
        <AuthField id="startDate" name="startDate" type="date" label="Start date" defaultValue={dateValue(project?.startDate)} error={state?.fieldErrors?.startDate} />
        <AuthField id="expectedEndDate" name="expectedEndDate" type="date" label="Expected end date" defaultValue={dateValue(project?.expectedEndDate)} error={state?.fieldErrors?.expectedEndDate} />
      </div>
      {state?.message ? <p role="status" className={`rounded-lg p-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null}
      <button disabled={pending} className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{pending ? "Saving…" : project ? "Save changes" : "Create project"}</button>
    </form>
  );
}
