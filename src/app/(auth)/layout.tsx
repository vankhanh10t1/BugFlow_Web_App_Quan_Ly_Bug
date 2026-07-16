import Link from "next/link";
import { Bug } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-12">{children}</section>
      <aside className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-blue-600"><Bug className="size-5" /></span>BugFlow</Link>
        <blockquote className="max-w-lg text-3xl font-medium leading-tight tracking-tight">“A reliable workflow turns every reported defect into shared understanding.”</blockquote>
        <p className="text-sm text-slate-400">Bảo mật mặc định · Dễ dàng kiểm tra</p>
      </aside>
    </main>
  );
}
