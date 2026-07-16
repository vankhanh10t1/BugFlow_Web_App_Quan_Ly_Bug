import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSystemRole } from "@/lib/auth";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata = { title: "Dự án mới" };
export default async function NewProjectPage() {
  await requireSystemRole(["ADMIN", "PROJECT_MANAGER"]);
  return <div className="mx-auto max-w-3xl"><Link href="/projects" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"><ChevronLeft className="size-4" />Dự án</Link><h1 className="mt-5 text-3xl font-semibold tracking-tight">Tạo dự án</h1><p className="mb-8 mt-2 text-slate-600">Mã dự án sẽ là tiền tố cho mã lỗi dễ đọc.</p><ProjectForm /></div>;
}
