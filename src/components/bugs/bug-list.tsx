import Link from "next/link";
import { Plus } from "lucide-react";
import type { BugQuery } from "@/lib/validators/bug";
import type { BugActor } from "@/features/bugs/service";
import { listBugs, listBugPeople, listBugProjects, listManagedProjectIds, listTriageMetadata } from "@/features/bugs/service";
import { listSavedViews } from "@/features/bugs/saved-view-service";
import { TriageWorkspace } from "@/components/bugs/triage-workspace";

export async function BugList({ actor, query, raw, mine = false }: { actor: BugActor; query: BugQuery; raw: Record<string, string | string[] | undefined>; mine?: boolean }) {
  const result = await listBugs(actor, { ...query, mine });
  const [projects, people, metadata, views, managedProjectIds] = await Promise.all([listBugProjects(actor), listBugPeople(actor), listTriageMetadata(actor), listSavedViews(actor), listManagedProjectIds(actor)]);
  return <TriageWorkspace initialItems={result.items} pagination={result.pagination} projects={projects} people={people} metadata={metadata} views={views} query={query} raw={raw} managedProjectIds={managedProjectIds} />;
}

export function NewBugLink() { return <Link href="/bugs/new" className="flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white"><Plus className="size-4" />Báo lỗi</Link>; }
