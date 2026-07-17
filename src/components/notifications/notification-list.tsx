"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Item = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  bug: { id: string; bugCode: string } | null;
  project: { id: string; code: string; name: string } | null;
  actor: { fullName: string } | null;
};
type Response = { success: true; data: { items: Item[]; unreadCount: number; pagination: { page: number; totalPages: number; total: number } } };

async function fetchNotifications(page: number) {
  const response = await fetch(`/api/notifications?page=${page}`);
  if (!response.ok) throw new Error("Không thể tải thông báo");
  return (await response.json()) as Response;
}

function target(item: Item) {
  if (item.bug) return { href: `/bugs/${item.bug.id}`, label: `Mở ${item.bug.bugCode}` };
  if (item.project) return { href: `/projects/${item.project.id}`, label: `Mở dự án ${item.project.code}` };
  return null;
}

export function NotificationList() {
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["notifications", page], queryFn: () => fetchNotifications(page), refetchInterval: 30_000 });
  const refresh = () => client.invalidateQueries({ queryKey: ["notifications"] });
  const patch = async (url: string) => { const response = await fetch(url, { method: "PATCH" }); if (!response.ok) throw new Error("Không thể cập nhật thông báo"); };
  const read = useMutation({ mutationFn: (id: string) => patch(`/api/notifications/${id}/read`), onSuccess: refresh });
  const all = useMutation({ mutationFn: () => patch("/api/notifications/read-all"), onSuccess: refresh });

  if (query.isLoading) return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  if (query.isError) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Không thể tải thông báo.</p>;
  const data = query.data?.data;
  return <div>
    <div className="mb-4 flex items-center justify-between"><span className="text-sm text-slate-500">{data?.unreadCount ?? 0} chưa đọc</span><button onClick={() => all.mutate()} disabled={!data?.unreadCount || all.isPending} className="rounded-lg border bg-white px-3 py-2 text-sm">Đánh dấu tất cả đã đọc</button></div>
    <div className="divide-y overflow-hidden rounded-xl border bg-white">{data?.items.length ? data.items.map((item) => { const destination = target(item); return <div key={item.id} className={`p-4 ${item.isRead ? "" : "bg-blue-50/50"}`}><div className="flex gap-3"><span className={`mt-2 size-2 shrink-0 rounded-full ${item.isRead ? "bg-slate-200" : "bg-blue-600"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{item.actor?.fullName ?? "Hệ thống"} · {new Date(item.createdAt).toLocaleString("vi-VN")}</p><div className="mt-3 flex gap-3">{destination ? <Link href={destination.href} onClick={() => !item.isRead && read.mutate(item.id)} className="text-xs font-medium text-blue-600">{destination.label}</Link> : null}{!item.isRead ? <button onClick={() => read.mutate(item.id)} className="text-xs text-slate-500">Đánh dấu đã đọc</button> : null}</div></div></div></div>; }) : <p className="p-8 text-center text-sm text-slate-500">Chưa có thông báo.</p>}</div>
    {data && data.pagination.totalPages > 1 ? <nav aria-label="Các trang thông báo" className="mt-4 flex items-center justify-between"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40">Trước</button><span className="text-sm text-slate-500">Trang {page}/{data.pagination.totalPages}</span><button disabled={page === data.pagination.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40">Sau</button></nav> : null}
  </div>;
}
