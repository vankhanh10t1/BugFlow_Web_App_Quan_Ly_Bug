"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function ChatError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error("[chat] page render failed", { error: error.message, digest: error.digest });
  }, [error]);

  return <div className="grid min-h-[60vh] place-items-center">
    <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <AlertTriangle className="mx-auto size-10 text-red-500" />
      <h1 className="mt-4 text-xl font-semibold">Không thể tải trang Chat</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Đã xảy ra lỗi khi khởi tạo trang. Vui lòng thử lại; dữ liệu của bạn chưa bị thay đổi.</p>
      {error.digest ? <p className="mt-2 font-mono text-xs text-slate-400">Mã tham chiếu: {error.digest}</p> : null}
      <button type="button" onClick={() => unstable_retry()} className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Thử lại</button>
    </div>
  </div>;
}
