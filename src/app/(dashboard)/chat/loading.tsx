export default function ChatLoading() {
  return <div className="space-y-6">
    <div className="space-y-2"><div className="h-4 w-28 animate-pulse rounded bg-slate-200" /><div className="h-9 w-44 animate-pulse rounded bg-slate-200" /></div>
    <div className="grid min-h-[70vh] overflow-hidden rounded-2xl border bg-white lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3 border-r p-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
      <div className="m-6 animate-pulse rounded-xl bg-slate-100" />
    </div>
  </div>;
}
