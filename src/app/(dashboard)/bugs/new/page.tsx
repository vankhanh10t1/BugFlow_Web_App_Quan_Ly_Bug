import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { listReportableProjects } from "@/features/bugs/service";
import { BugForm } from "@/components/bugs/bug-form";
import { attachmentLimits } from "@/lib/validators/attachment";
export const metadata = { title: "Báo lỗi" };
export default async function NewBugPage() { const actor = await requirePageUser(); const projects = await listReportableProjects(actor); return <div className="mx-auto max-w-4xl"><Link href="/bugs" className="inline-flex items-center gap-1 text-sm text-slate-500"><ChevronLeft className="size-4" />Danh sách lỗi</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight">Báo lỗi mới</h1><p className="mb-8 mt-2 text-slate-600">Cung cấp đủ bối cảnh để thành viên khác có thể tái hiện lỗi.</p>{projects.length ? <BugForm projects={projects} attachmentLimits={attachmentLimits()} /> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">Bạn cần có vai trò Kiểm thử viên hoặc Quản lý dự án trước khi báo lỗi.</div>}</div>; }
