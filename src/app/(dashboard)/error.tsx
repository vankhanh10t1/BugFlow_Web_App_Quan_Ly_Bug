"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => { console.error("Dashboard route failed", error); }, [error]);
  return <div className="mx-auto grid min-h-[420px] max-w-xl place-items-center"><div className="w-full rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm"><AlertTriangle className="mx-auto size-10 text-red-500" /><h1 className="mt-4 text-xl font-semibold">Unable to load this page</h1><p className="mt-2 text-sm leading-6 text-slate-600">The database may be temporarily unavailable. Please try again; your data has not been changed.</p>{error.digest ? <p className="mt-2 font-mono text-xs text-slate-400">Reference: {error.digest}</p> : null}<button onClick={() => unstable_retry()} className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Try again</button></div></div>;
}
