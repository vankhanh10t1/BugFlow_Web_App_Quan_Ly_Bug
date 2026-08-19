import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { getDocument, listRevisions } from "@/features/documents/service";
import { LocalDateTime } from "@/components/documents/local-date-time";

export default async function RevisionsPage({ params }: { params: Promise<{ projectId: string; documentId: string }> }) {
  const p = await params; const actor = await requirePageUser(); const [doc, items] = await Promise.all([getDocument(p.projectId, p.documentId, actor), listRevisions(p.projectId, p.documentId, actor)]);
  return <><Link href={`/projects/${p.projectId}/documents/${p.documentId}`} className="inline-flex items-center gap-1 text-sm text-slate-500"><ChevronLeft className="size-4" />{doc.title}</Link><h1 className="my-6 text-3xl font-semibold">Lịch sử phiên bản</h1><div className="divide-y rounded-xl border bg-white">{items.map(item => <Link key={item.id} href={`/projects/${p.projectId}/documents/${p.documentId}/revisions/${item.id}`} className="flex flex-wrap items-center justify-between gap-3 p-5 hover:bg-slate-50"><div><p className="font-medium">Phiên bản {item.version}</p><p className="mt-1 text-sm text-slate-500">{item.title}</p></div><p className="text-sm text-slate-500">{item.createdBy.fullName} · <LocalDateTime value={item.createdAt} /></p></Link>)}</div></>;
}
