import Link from "next/link";
import { ArrowRight, Bug, ChartNoAxesCombined, GitPullRequestArrow, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  { icon: GitPullRequestArrow, title: "Workflow có kiểm soát", text: "Mỗi chuyển trạng thái đều được xác thực và lưu dấu vết." },
  { icon: ShieldCheck, title: "Phân quyền thực sự", text: "System role và project role được kiểm tra lại ở server." },
  { icon: ChartNoAxesCombined, title: "Thông tin để hành động", text: "Theo dõi tiến độ, lỗi quá hạn và tải công việc của đội ngũ." },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5" aria-label="Điều hướng chính">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white"><Bug className="size-5" /></span>
          BugFlow
        </Link>
        <span className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-slate-600">Foundation · Phase 1–2</span>
      </nav>

      <section className="relative mx-auto grid max-w-6xl gap-14 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:pt-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <span className="size-1.5 rounded-full bg-blue-600" /> Từ báo lỗi đến bản sửa, trong một luồng rõ ràng
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl">
            Theo dõi bug mà không đánh mất <span className="text-blue-600">bối cảnh.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Không gian làm việc tập trung cho tester, developer và project manager — với workflow, quyền truy cập và activity log được thiết kế ngay từ lõi.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#architecture" className={cn(buttonVariants({ size: "lg" }))}>Khám phá kiến trúc <ArrowRight className="size-4" /></Link>
            <Link href="https://github.com" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>Tài liệu dự án</Link>
          </div>
        </div>

        <div className="relative rounded-2xl border bg-white p-3 shadow-2xl shadow-slate-300/40">
          <div className="rounded-xl border bg-slate-950 p-5 text-white">
            <div className="mb-8 flex items-center justify-between"><span className="text-sm font-medium">Sprint overview</span><span className="text-xs text-slate-400">SHOP · Active</span></div>
            <div className="grid grid-cols-3 gap-3">
              {[['24','Open'],['7','In progress'],['82%','Resolved']].map(([value,label]) => <div key={label} className="rounded-lg bg-white/5 p-3"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p></div>)}
            </div>
            <div className="mt-5 space-y-2">
              {[['SHOP-021','Checkout fails on Safari','Urgent'],['SHOP-018','Incorrect invoice total','High'],['SHOP-014','Avatar upload timeout','Medium']].map(([code,title,priority]) => <div key={code} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[.03] p-3"><span className="text-xs text-blue-300">{code}</span><span className="min-w-0 flex-1 truncate text-sm">{title}</span><span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-slate-300">{priority}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="border-y bg-white">
        <div className="mx-auto grid max-w-6xl gap-px bg-slate-200 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => <article key={title} className="bg-white px-7 py-10"><Icon className="mb-5 size-5 text-blue-600" /><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}
        </div>
      </section>
    </main>
  );
}
