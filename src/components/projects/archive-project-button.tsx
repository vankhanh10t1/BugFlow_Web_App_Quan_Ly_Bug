"use client";

import { useState } from "react";
import { archiveProjectAction } from "@/features/projects/actions";

export function ArchiveProjectButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  return <>{<button type="button" onClick={() => setOpen(true)} className="h-10 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50">Lưu trữ dự án</button>}{open ? <div role="dialog" aria-modal="true" aria-labelledby="archive-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 id="archive-title" className="text-lg font-semibold">Lưu trữ dự án này?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Dự án vẫn được giữ lại để kiểm tra nhưng sẽ được đánh dấu là đã lưu trữ.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setOpen(false)} className="h-10 rounded-lg border px-4 text-sm">Hủy</button><form action={archiveProjectAction.bind(null, projectId)}><button className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white">Lưu trữ</button></form></div></div></div> : null}</>;
}
