import Link from "next/link";
import { ArrowRight, BookOpen, Bug, CheckCircle2, Database, LockKeyhole, Workflow } from "lucide-react";

export const metadata = { title: "Tài liệu dự án", description: "Hướng dẫn công khai dành cho người dùng BugFlow." };

const features = [
  "Đăng nhập bằng email và mật khẩu với session JWT bảo mật",
  "Phân quyền theo system role và project role ở phía server",
  "Tạo, tìm kiếm, lọc và quản lý thành viên project",
  "Theo dõi vòng đời bug với workflow và activity log",
];

export default function DocsPage() {
  return <main className="min-h-screen bg-slate-50 text-slate-950"><nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"><Link href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white"><Bug className="size-5" /></span>BugFlow</Link><Link href="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Đăng nhập</Link></nav>
    <article className="mx-auto max-w-5xl px-6 pb-20 pt-12"><div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"><BookOpen className="size-4" />Tài liệu người dùng</div><h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">BugFlow giúp đội ngũ xử lý lỗi trong một quy trình rõ ràng.</h1><p className="mt-5 text-lg leading-8 text-slate-600">Đây là tài liệu công khai đã được chọn lọc cho bản demo.</p></div>
      <div className="mt-12 grid gap-5 md:grid-cols-3"><section className="rounded-xl border bg-white p-6"><Workflow className="size-5 text-blue-600" /><h2 className="mt-4 font-semibold">Mục tiêu</h2><p className="mt-2 text-sm leading-6 text-slate-600">Quản lý toàn bộ vòng đời bug từ báo lỗi, phân công, sửa, retest đến đóng lỗi.</p></section><section className="rounded-xl border bg-white p-6"><LockKeyhole className="size-5 text-blue-600" /><h2 className="mt-4 font-semibold">Bảo mật</h2><p className="mt-2 text-sm leading-6 text-slate-600">Quyền truy cập được kiểm tra lại trong service và Route Handler, không chỉ ẩn nút trên UI.</p></section><section className="rounded-xl border bg-white p-6"><Database className="size-5 text-blue-600" /><h2 className="mt-4 font-semibold">Công nghệ</h2><p className="mt-2 text-sm leading-6 text-slate-600">Next.js, React, TypeScript, Prisma và Neon PostgreSQL, triển khai theo kiến trúc serverless.</p></section></div>
      <section className="mt-10 rounded-xl border bg-white p-6"><h2 className="text-xl font-semibold">Tính năng</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2">{features.map((feature) => <li key={feature} className="flex gap-3 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />{feature}</li>)}</ul></section>
      <section className="mt-10 rounded-xl bg-slate-950 p-7 text-white"><p className="text-sm font-medium text-blue-300">Tài khoản demo</p><h2 className="mt-2 text-2xl font-semibold">Trải nghiệm với vai trò Tester</h2><div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-4 font-mono text-sm"><p>tester@bugflow.dev</p><p className="mt-1 text-slate-300">Password@123</p></div><p className="mt-4 text-xs leading-5 text-slate-400">Đây là credential demo công khai, không dùng cho production hoặc dữ liệu thật. Dữ liệu được tạo bởi Prisma seed.</p><Link href="/login" className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-slate-950">Mở trang đăng nhập <ArrowRight className="size-4" /></Link></section>
      <section className="mt-10"><h2 className="text-xl font-semibold">Cách sử dụng</h2><ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600"><li>Mở trang đăng nhập từ nút trên thanh điều hướng.</li><li>Nhập tài khoản demo hoặc tài khoản đã đăng ký.</li><li>Sau khi xác thực, ứng dụng chuyển tới dashboard và hiển thị tên cùng system role.</li><li>Dùng nút đăng xuất trên header dashboard hoặc biểu tượng đăng xuất ở trang chủ.</li></ol></section>
    </article></main>;
}
