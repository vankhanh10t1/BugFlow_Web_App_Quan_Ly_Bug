"use client";

import Link from "next/link";
import { memo, useCallback, useDeferredValue, useMemo, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, Copy, Search, ShieldCheck, Users } from "lucide-react";

type Audience = "Tất cả" | "Admin" | "Quản lý" | "Thành viên";
type Category = "Tất cả" | "Bắt đầu" | "Dự án" | "Bug" | "Phối hợp" | "Bảo mật";
type Guide = { id: string; title: string; summary: string; audience: Exclude<Audience, "Tất cả">[]; category: Exclude<Category, "Tất cả">; updatedAt: string; steps: string[] };

const guides: Guide[] = [
  { id: "bat-dau", title: "Bắt đầu và đăng nhập 2FA", summary: "Đăng nhập, xác minh hai lớp và truy cập dashboard an toàn.", audience: ["Admin", "Quản lý", "Thành viên"], category: "Bắt đầu", updatedAt: "22/07/2026", steps: ["Đăng nhập bằng tài khoản đã đăng ký.", "Hoàn tất thiết lập hoặc xác minh 2FA bắt buộc.", "Dùng recovery code khi không thể lấy mã TOTP."] },
  { id: "quan-ly-du-an", title: "Quản lý dự án và thành viên", summary: "Tạo dự án, cập nhật thông tin và phân quyền thành viên.", audience: ["Admin", "Quản lý"], category: "Dự án", updatedAt: "22/07/2026", steps: ["Admin có thể quản trị toàn hệ thống theo quyền hiện có.", "Project Manager quản lý dự án và thành viên trong phạm vi phụ trách.", "Kiểm tra vai trò project trước khi thay đổi membership hoặc cài đặt."] },
  { id: "bao-loi", title: "Báo một lỗi rõ ràng", summary: "Tạo Bug với tiêu đề, mô tả, priority, severity và minh chứng.", audience: ["Quản lý", "Thành viên"], category: "Bug", updatedAt: "22/07/2026", steps: ["Chọn đúng dự án và mô tả bước tái hiện.", "Đính kèm ảnh, video, log, text hoặc PDF hợp lệ.", "Chọn priority/severity dựa trên ảnh hưởng thực tế."] },
  { id: "workflow-bug", title: "Workflow xử lý Bug", summary: "Phân công, cập nhật trạng thái, retest và đóng lỗi.", audience: ["Quản lý", "Thành viên"], category: "Bug", updatedAt: "22/07/2026", steps: ["Manager hoặc người có quyền phân công assignee.", "Developer cập nhật tiến độ và trạng thái xử lý.", "Tester retest, ghi kết quả rồi đóng hoặc mở lại Bug."] },
  { id: "comment-mention", title: "Comment, mention và notification", summary: "Phối hợp ngay trên Bug mà không bỏ sót người liên quan.", audience: ["Quản lý", "Thành viên"], category: "Phối hợp", updatedAt: "22/07/2026", steps: ["Comment tập trung vào thông tin mới hoặc quyết định cần lưu.", "Mention đúng thành viên cần phản hồi.", "Theo dõi notification và đánh dấu đã đọc sau khi xử lý."] },
  { id: "chat", title: "Chat nội bộ và chia sẻ tệp", summary: "Dùng Project, Direct hoặc Support chat theo quyền hiện tại.", audience: ["Admin", "Quản lý", "Thành viên"], category: "Phối hợp", updatedAt: "22/07/2026", steps: ["Project VIEWER chỉ đọc; các quyền khác tuân theo membership.", "Chỉ mở direct chat với người dùng hợp lệ theo rule dự án.", "Không gửi secret hoặc dữ liệu ngoài phạm vi dự án qua chat."] },
  { id: "ai-chatbot", title: "Sử dụng AI Chatbot an toàn", summary: "Nhờ AI hướng dẫn, cải thiện Bug hoặc gợi ý phân loại.", audience: ["Admin", "Quản lý", "Thành viên"], category: "Phối hợp", updatedAt: "22/07/2026", steps: ["AI chỉ nhận context mà server đã kiểm tra quyền.", "Không nhập secret, API key hoặc dữ liệu nhạy cảm.", "Luôn kiểm tra lại gợi ý trước khi áp dụng vào công việc."] },
  { id: "bao-mat", title: "Quyền truy cập và an toàn dữ liệu", summary: "Hiểu RBAC, same-origin guard, rate limit và upload validation.", audience: ["Admin", "Quản lý"], category: "Bảo mật", updatedAt: "22/07/2026", steps: ["UI ẩn hành động không đồng nghĩa với quyền server.", "API kiểm tra lại auth, role và project membership.", "Báo Admin khi phát hiện truy cập hoặc upload bất thường."] },
];

const audiences: Audience[] = ["Tất cả", "Admin", "Quản lý", "Thành viên"];
const categories: Category[] = ["Tất cả", "Bắt đầu", "Dự án", "Bug", "Phối hợp", "Bảo mật"];

export function filterGuides(items: Guide[], query: string, audience: Audience, category: Category) {
  const normalized = query.trim().toLocaleLowerCase("vi");
  return items.filter((guide) => (!normalized || `${guide.title} ${guide.summary} ${guide.steps.join(" ")}`.toLocaleLowerCase("vi").includes(normalized)) && (audience === "Tất cả" || guide.audience.includes(audience)) && (category === "Tất cả" || guide.category === category));
}

export function DocsExplorer() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [audience, setAudience] = useState<Audience>("Tất cả");
  const [category, setCategory] = useState<Category>("Tất cả");
  const [sort, setSort] = useState<"default" | "name">("default");
  const [copied, setCopied] = useState("");
  const visible = useMemo(() => {
    const filtered = filterGuides(guides, deferredQuery, audience, category);
    return sort === "name" ? [...filtered].sort((a, b) => a.title.localeCompare(b.title, "vi")) : filtered;
  }, [audience, category, deferredQuery, sort]);

  const copyLink = useCallback(async (id: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${id}`);
    setCopied(id);
    window.setTimeout(() => setCopied((current) => current === id ? "" : current), 1_500);
  }, []);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="h-fit rounded-xl border bg-white p-4 lg:sticky lg:top-20">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm hướng dẫn…" className="h-9 w-full rounded-lg border pl-9 pr-3 text-sm" /></div>
        <Filter label="Theo vai trò" value={audience} values={audiences} change={(value) => setAudience(value as Audience)} />
        <Filter label="Theo chủ đề" value={category} values={categories} change={(value) => setCategory(value as Category)} />
        <label className="mt-4 block text-xs font-medium text-slate-600">Sắp xếp<select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="mt-1 h-9 w-full rounded-lg border bg-white px-2 text-sm"><option value="default">Ưu tiên sử dụng</option><option value="name">Tên A–Z</option></select></label>
        <button type="button" onClick={() => { setQuery(""); setAudience("Tất cả"); setCategory("Tất cả"); setSort("default"); }} className="mt-4 w-full rounded-lg border px-3 py-2 text-xs font-medium text-slate-600">Đặt lại bộ lọc</button>
      </aside>

      <section className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">Danh sách hướng dẫn</h2><p className="text-xs text-slate-500">{visible.length} mục phù hợp · chỉ tải nội dung chữ cần thiết</p></div><Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white">Mở BugFlow <ArrowRight className="size-3" /></Link></div>
        {visible.length ? <div className="space-y-3">{visible.map((guide) => <GuideCard key={guide.id} guide={guide} copied={copied === guide.id} copy={copyLink} />)}</div> : <div className="rounded-xl border border-dashed bg-white p-10 text-center"><BookOpen className="mx-auto size-8 text-slate-300" /><h3 className="mt-3 font-medium">Không tìm thấy hướng dẫn</h3><p className="mt-1 text-sm text-slate-500">Thử từ khóa khác hoặc đặt lại bộ lọc.</p></div>}
        <div className="mt-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><ShieldCheck className="mt-0.5 size-5 shrink-0" /><p><strong>Phạm vi hiện tại:</strong> đây là tài liệu hướng dẫn công khai, không phải kho file theo project. Upload/xóa tài liệu theo role chưa tồn tại trong schema/API nên không hiển thị hành động giả.</p></div>
      </section>
    </div>
  );
}

function Filter({ label, value, values, change }: { label: string; value: string; values: string[]; change: (value: string) => void }) { return <fieldset className="mt-4"><legend className="text-xs font-medium text-slate-600">{label}</legend><div className="mt-2 flex flex-wrap gap-1.5">{values.map((item) => <button type="button" key={item} onClick={() => change(item)} className={`rounded-full px-2.5 py-1 text-xs ${value === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{item}</button>)}</div></fieldset>; }

const GuideCard = memo(function GuideCard({ guide, copied, copy }: { guide: Guide; copied: boolean; copy: (id: string) => void }) { return <article id={guide.id} className="scroll-mt-24 rounded-xl border bg-white"><details className="group"><summary className="cursor-pointer list-none p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">{guide.category === "Phối hợp" ? <Users className="size-4" /> : guide.category === "Bảo mật" ? <ShieldCheck className="size-4" /> : <BookOpen className="size-4" />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="text-sm">{guide.title}</strong><span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{guide.category}</span></span><span className="mt-1 block text-sm text-slate-600">{guide.summary}</span><span className="mt-2 block text-[11px] text-slate-400">Dành cho {guide.audience.join(" · ")} · Cập nhật {guide.updatedAt}</span></span><span className="text-slate-400 transition group-open:rotate-90">›</span></div></summary><div className="border-t px-4 py-4"><ol className="space-y-2">{guide.steps.map((step) => <li key={step} className="flex gap-2 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-1 size-4 shrink-0 text-emerald-600" />{step}</li>)}</ol><button type="button" onClick={() => void copy(guide.id)} className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-slate-600"><Copy className="size-3" />{copied ? "Đã sao chép" : "Sao chép liên kết"}</button></div></details></article>; });
