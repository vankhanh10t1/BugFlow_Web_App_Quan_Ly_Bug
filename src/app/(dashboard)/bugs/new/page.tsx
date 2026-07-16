import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { listReportableProjects } from "@/features/bugs/service";
import { BugForm } from "@/components/bugs/bug-form";
export const metadata = { title: "Report bug" };
export default async function NewBugPage() { const actor = await requirePageUser(); const projects = await listReportableProjects(actor); return <div className="mx-auto max-w-4xl"><Link href="/bugs" className="inline-flex items-center gap-1 text-sm text-slate-500"><ChevronLeft className="size-4" />Bugs</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight">Report a bug</h1><p className="mb-8 mt-2 text-slate-600">Provide enough context for another team member to reproduce the issue.</p>{projects.length ? <BugForm projects={projects} /> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">You need a Tester or Manager project role before reporting a bug.</div>}</div>; }
