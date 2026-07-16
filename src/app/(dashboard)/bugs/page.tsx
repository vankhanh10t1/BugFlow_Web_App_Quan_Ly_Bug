import { requirePageUser } from "@/lib/auth";
import { bugQuerySchema } from "@/lib/validators/bug";
import { BugList, NewBugLink } from "@/components/bugs/bug-list";

export const metadata = { title: "Bugs" };
const scalar = (value: string | string[] | undefined) => typeof value === "string" && value ? value : undefined;
export default async function BugsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requirePageUser(); const raw = await searchParams; const query = bugQuerySchema.parse(Object.fromEntries(Object.entries(raw).map(([key,value]) => [key, scalar(value)]).filter(([,value]) => value !== undefined)));
  return <><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-blue-600">Issue tracking</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Bugs</h1><p className="mt-2 text-slate-600">Search and triage issues across your projects.</p></div><NewBugLink /></div><BugList actor={actor} query={query} raw={raw} /></>;
}
