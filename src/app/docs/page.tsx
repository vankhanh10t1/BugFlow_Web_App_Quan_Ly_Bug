import Link from "next/link";
import { BookOpen, Bug } from "lucide-react";
import { DocsExplorer } from "@/components/docs/docs-explorer";

export const metadata = { title: "Tài liệu dự án", description: "Hướng dẫn công khai dành cho người dùng BugFlow." };

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <nav className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white"><Bug className="size-5" /></span>BugFlow</Link>
          <Link href="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Đăng nhập</Link>
        </div>
      </nav>
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700"><BookOpen className="size-4" />Tài liệu người dùng</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Tìm hướng dẫn BugFlow nhanh hơn</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Tìm theo chủ đề hoặc vai trò, mở đúng hướng dẫn cần dùng và sao chép liên kết để phối hợp trong đội dự án.</p>
        </div>
      </header>
      <DocsExplorer />
    </main>
  );
}
