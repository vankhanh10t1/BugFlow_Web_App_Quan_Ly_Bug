"use client";

import { usePathname } from "next/navigation";
import { Bot, Send, X } from "lucide-react";
import { useMemo, useState } from "react";

type Task = "GUIDE" | "IMPROVE_BUG" | "CLASSIFY_BUG";
const labels: Record<Task, string> = { GUIDE: "Hướng dẫn sử dụng", IMPROVE_BUG: "Cải thiện báo cáo lỗi", CLASSIFY_BUG: "Gợi ý ưu tiên và mức độ" };

export function AiChatbot() {
  const pathname = usePathname();
  const bugId = useMemo(() => pathname.match(/^\/bugs\/([^/]+)$/)?.[1], [pathname]);
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState<Task>("GUIDE");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setError(""); setAnswer("");
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task, prompt, ...(bugId ? { bugId } : {}) }) });
      const body = await response.json() as { message: string; data?: { answer?: string } };
      if (!response.ok) throw new Error(body.message || "Không thể gọi AI");
      setAnswer(body.data?.answer ?? "AI không trả về nội dung.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể gọi AI"); }
    finally { setPending(false); }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Mở trợ lý AI" className="fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"><Bot className="size-5" /></button>
    {open ? <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/30 p-0 sm:p-5" role="dialog" aria-modal="true" aria-label="Trợ lý AI BugFlow">
      <section className="flex h-[90vh] w-full flex-col bg-white shadow-2xl sm:h-[620px] sm:max-w-md sm:rounded-2xl">
        <header className="flex items-center gap-3 border-b p-4"><span className="grid size-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><Bot className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="font-semibold">Trợ lý AI BugFlow</h2><p className="truncate text-xs text-slate-500">Gợi ý cần được bạn kiểm tra và xác nhận</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Đóng trợ lý AI" className="grid size-9 place-items-center rounded-lg hover:bg-slate-100"><X className="size-4" /></button></header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <label className="text-sm font-medium">Tác vụ<select value={task} onChange={(event) => setTask(event.target.value as Task)} className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 text-sm">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          {bugId ? <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">Đang dùng ngữ cảnh Bug trên màn hình này. Server sẽ kiểm tra lại quyền truy cập.</p> : null}
          {answer ? <div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{answer}</div> : <div className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-slate-500">Chọn tác vụ và nhập yêu cầu. AI không tự thay đổi dữ liệu.</div>}
          {error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </div>
        <form onSubmit={submit} className="border-t p-4"><label className="sr-only" htmlFor="ai-prompt">Yêu cầu</label><textarea id="ai-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} required minLength={2} maxLength={4000} rows={3} placeholder="Nhập câu hỏi hoặc nội dung cần hỗ trợ…" className="w-full resize-none rounded-xl border p-3 text-sm" /><button disabled={pending || prompt.trim().length < 2} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white disabled:opacity-50"><Send className="size-4" />{pending ? "AI đang xử lý…" : "Gửi yêu cầu"}</button></form>
      </section>
    </div> : null}
  </>;
}
