"use client";

import { useActionState } from "react";
import { assignBugAction, type BugActionState } from "@/features/bugs/actions";

export function AssignBugForm({ bugId, currentId, developers }: { bugId: string; currentId: string | null; developers: { id: string; fullName: string }[] }) {
  const [state, action, pending] = useActionState<BugActionState, FormData>(assignBugAction.bind(null, bugId), undefined);
  return <form action={action} className="space-y-3"><select name="assigneeId" defaultValue={currentId ?? ""} className="h-10 w-full rounded-lg border bg-white px-3 text-sm"><option value="">Unassigned</option>{developers.map((developer) => <option key={developer.id} value={developer.id}>{developer.fullName}</option>)}</select><button disabled={pending} className="h-10 w-full rounded-lg bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-60">{pending ? "Assigning…" : "Update assignee"}</button>{state?.message ? <p className={`text-xs ${state.success ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p> : null}</form>;
}
