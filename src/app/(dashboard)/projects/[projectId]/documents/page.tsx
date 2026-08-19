import Link from "next/link";
import { ChevronLeft, FileText, Plus } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { listDocuments } from "@/features/documents/service";
import { documentQuerySchema } from "@/lib/validators/document";
import { DocumentFilters } from "@/components/documents/document-filters";
import { LocalDateTime } from "@/components/documents/local-date-time";

export default async function DocumentsPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { projectId } = await params; const raw = await searchParams;
  const query = documentQuerySchema.parse({ search: typeof raw.search === "string" ? raw.search : undefined, type: typeof raw.type === "string" ? raw.type : undefined, page: raw.page, pageSize: 20 });
  const data = await listDocuments(projectId, await requirePageUser(), query);
  return <><Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-slate-500"><ChevronLeft className="size-4" />Dự án</Link><div className="my-6 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold">Tài liệu</h1><p className="mt-1 text-slate-600">Kho kiến thức nội bộ của dự án.</p></div>{data.permissions.canEdit ? <Link href={`/projects/${projectId}/documents/new`} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"><Plus className="size-4" />Tạo tài liệu</Link> : null}</div><DocumentFilters /><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.items.map(doc => <Link key={doc.id} href={`/projects/${projectId}/documents/${doc.id}`} className="rounded-xl border bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"><div className="flex items-start gap-3"><FileText className="mt-0.5 size-5 text-blue-600" /><div className="min-w-0"><h2 className="truncate font-semibold">{doc.title}</h2><p className="mt-1 text-xs text-slate-500">{doc.type?.replaceAll("_", " ") || "OTHER"} · {doc._count.revisions} phiên bản</p><p className="mt-4 text-xs text-slate-500">Cập nhật <LocalDateTime value={doc.updatedAt} /></p></div></div></Link>)}</div>{data.items.length === 0 ? <div className="mt-6 rounded-xl border border-dashed bg-white p-12 text-center text-slate-500"><FileText className="mx-auto mb-3 size-8" /><p>Chưa có tài liệu phù hợp.</p></div> : null}</>;
}
