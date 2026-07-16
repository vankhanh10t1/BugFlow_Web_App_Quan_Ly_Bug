"use client";

import { useActionState } from "react";
import { AuthField } from "@/components/auth/auth-field";
import { createBugAction, type BugActionState, updateBugAction } from "@/features/bugs/actions";

type ProjectOption = { id: string; code: string; name: string };
type BugDefaults = { id: string; title: string; description: string; reproductionSteps: string | null; expectedResult: string | null; actualResult: string | null; environment: string | null; browser: string | null; operatingSystem: string | null; applicationVersion: string | null; priority: string; severity: string; dueDate: Date | null };

function TextArea({ id, label, value, required, error }: { id: string; label: string; value?: string | null; required?: boolean; error?: string[] }) { return <div className="space-y-1.5"><label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label><textarea id={id} name={id} defaultValue={value ?? ""} required={required} rows={id === "description" || id === "reproductionSteps" ? 5 : 3} aria-invalid={Boolean(error?.length)} className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 aria-[invalid=true]:border-red-500" />{error?.length ? <p className="text-xs text-red-600">{error[0]}</p> : null}</div>; }

export function BugForm({ projects = [], bug }: { projects?: ProjectOption[]; bug?: BugDefaults }) {
  const action = bug ? updateBugAction.bind(null, bug.id) : createBugAction;
  const [state, formAction, pending] = useActionState<BugActionState, FormData>(action, undefined);
  return <form action={formAction} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
    {!bug ? <div className="space-y-1.5"><label htmlFor="projectId" className="text-sm font-medium text-slate-700">Project</label><select id="projectId" name="projectId" required className="h-11 w-full rounded-lg border bg-white px-3 text-sm"><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}</select>{state?.fieldErrors?.projectId ? <p className="text-xs text-red-600">{state.fieldErrors.projectId[0]}</p> : null}</div> : null}
    <AuthField id="title" name="title" label="Bug title" defaultValue={bug?.title} placeholder="Checkout fails when applying a voucher" error={state?.fieldErrors?.title} required />
    <TextArea id="description" label="Description" value={bug?.description} error={state?.fieldErrors?.description} required />
    <TextArea id="reproductionSteps" label="Steps to reproduce" value={bug?.reproductionSteps} error={state?.fieldErrors?.reproductionSteps} />
    <div className="grid gap-5 md:grid-cols-2"><TextArea id="expectedResult" label="Expected result" value={bug?.expectedResult} /><TextArea id="actualResult" label="Actual result" value={bug?.actualResult} /></div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"><AuthField id="environment" name="environment" label="Environment" defaultValue={bug?.environment ?? ""} placeholder="Staging" /><AuthField id="browser" name="browser" label="Browser" defaultValue={bug?.browser ?? ""} placeholder="Chrome 126" /><AuthField id="operatingSystem" name="operatingSystem" label="Operating system" defaultValue={bug?.operatingSystem ?? ""} placeholder="Windows 11" /><AuthField id="applicationVersion" name="applicationVersion" label="App version" defaultValue={bug?.applicationVersion ?? ""} placeholder="2.4.1" /></div>
    <div className="grid gap-5 sm:grid-cols-3"><div className="space-y-1.5"><label htmlFor="priority" className="text-sm font-medium">Priority</label><select id="priority" name="priority" defaultValue={bug?.priority ?? "MEDIUM"} className="h-11 w-full rounded-lg border bg-white px-3 text-sm">{["LOW","MEDIUM","HIGH","URGENT"].map((value) => <option key={value}>{value}</option>)}</select></div><div className="space-y-1.5"><label htmlFor="severity" className="text-sm font-medium">Severity</label><select id="severity" name="severity" defaultValue={bug?.severity ?? "MAJOR"} className="h-11 w-full rounded-lg border bg-white px-3 text-sm">{["MINOR","MAJOR","CRITICAL","BLOCKER"].map((value) => <option key={value}>{value}</option>)}</select></div><AuthField id="dueDate" name="dueDate" type="date" label="Due date" defaultValue={bug?.dueDate ? new Date(bug.dueDate).toISOString().slice(0,10) : ""} /></div>
    {state?.message ? <p role="status" className={`rounded-lg p-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null}<button disabled={pending} className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white disabled:opacity-60">{pending ? "Saving…" : bug ? "Save bug" : "Create bug"}</button>
  </form>;
}
