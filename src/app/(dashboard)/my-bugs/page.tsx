import { requirePageUser } from "@/lib/auth";
import { bugQuerySchema } from "@/lib/validators/bug";
import { BugList } from "@/components/bugs/bug-list";
const scalar = (value: string | string[] | undefined) => typeof value === "string" && value ? value : undefined;
export const metadata = { title: "My bugs" };
export default async function MyBugsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { const actor = await requirePageUser(); const raw = await searchParams; const query = bugQuerySchema.parse(Object.fromEntries(Object.entries(raw).map(([key,value]) => [key,scalar(value)]).filter(([,value]) => value !== undefined))); return <><div><p className="text-sm font-medium text-blue-600">Personal queue</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">My assigned bugs</h1><p className="mt-2 text-slate-600">Issues currently assigned to you.</p></div><BugList actor={actor} query={query} raw={raw} mine /></>; }
