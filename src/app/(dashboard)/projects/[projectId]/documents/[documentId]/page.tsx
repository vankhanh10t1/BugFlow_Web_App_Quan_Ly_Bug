import Link from "next/link";
import { ChevronLeft, Clock3, Pencil } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { getDocument, listRevisions } from "@/features/documents/service";
import { MarkdownViewer } from "@/components/documents/markdown-viewer";
import { DeleteDocumentButton } from "@/components/documents/document-actions";
import { LocalDateTime } from "@/components/documents/local-date-time";

export default async function DocumentPage({ params }: { params: Promise<{ projectId: string; documentId: string }> }) {
  const p = await params; const actor = await requirePageUser(); const [doc, revisions] = await Promise.all([getDocument(p.projectId, p.documentId, actor), listRevisions(p.projectId, p.documentId, actor)]);
  return <><Link href={`/projects/${p.projectId}/documents`} className="inline-flex items-center gap-1 text-sm text-slate-500"><ChevronLeft className="size-4" />Tài liệu</Link><div className="my-6 flex flex-wrap items-start justify-between gap-4"><div><span className="text-xs font-medium text-blue-700">{doc.type?.replaceAll("_", " ")}</span><h1 className="mt-2 text-3xl font-semibold">{doc.title}</h1><p className="mt-2 text-sm text-slate-500">Cập nhật bởi {doc.updatedBy?.fullName || doc.createdBy.fullName} · <LocalDateTime value={doc.updatedAt} /></p></div><div className="flex gap-2">{doc.permissions.canEdit ? <Link href={`/projects/${p.projectId}/documents/${p.documentId}/edit`} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm"><Pencil className="size-4" />Chỉnh sửa</Link> : null}<Link href={`/projects/${p.projectId}/documents/${p.documentId}/revisions`} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm"><Clock3 className="size-4" />Lịch sử ({revisions.length})</Link>{doc.permissions.canManage ? <DeleteDocumentButton projectId={p.projectId} documentId={p.documentId} /> : null}</div></div><article className="rounded-xl border bg-white p-6 sm:p-8"><MarkdownViewer content={doc.content} /></article></>;
}
