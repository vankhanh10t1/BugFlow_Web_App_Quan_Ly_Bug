"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type Item = { id: string; title: string; message: string; isRead: boolean; createdAt: string; bug: { id: string; bugCode: string } | null; actor: { fullName: string } | null };
type Response = { success: true; data: { items: Item[]; unreadCount: number; pagination: { page: number; totalPages: number; total: number } } };
async function fetchNotifications(page: number) { const response = await fetch(`/api/notifications?page=${page}`); if (!response.ok) throw new Error("Unable to load notifications"); return (await response.json()) as Response; }

export function NotificationList() {
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["notifications", page], queryFn: () => fetchNotifications(page), refetchInterval: 30_000 });
  const refresh = () => client.invalidateQueries({ queryKey: ["notifications"] });
  const patch = async (url: string) => { const response = await fetch(url, { method: "PATCH" }); if (!response.ok) throw new Error("Unable to update notification"); };
  const read = useMutation({ mutationFn: (id: string) => patch(`/api/notifications/${id}/read`), onSuccess: refresh });
  const all = useMutation({ mutationFn: () => patch("/api/notifications/read-all"), onSuccess: refresh });
  if (query.isLoading) return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  if (query.isError) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">Unable to load notifications.</p>;
  const data = query.data?.data;
  return <div><div className="mb-4 flex items-center justify-between"><span className="text-sm text-slate-500">{data?.unreadCount ?? 0} unread</span><button onClick={() => all.mutate()} disabled={!data?.unreadCount || all.isPending} className="rounded-lg border bg-white px-3 py-2 text-sm">Mark all read</button></div><div className="divide-y overflow-hidden rounded-xl border bg-white">{data?.items.length ? data.items.map((item) => <div key={item.id} className={`p-4 ${item.isRead ? "" : "bg-blue-50/50"}`}><div className="flex gap-3"><span className={`mt-2 size-2 shrink-0 rounded-full ${item.isRead ? "bg-slate-200" : "bg-blue-600"}`} /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{item.actor?.fullName ?? "System"} · {new Date(item.createdAt).toLocaleString()}</p><div className="mt-3 flex gap-3">{item.bug ? <Link href={`/bugs/${item.bug.id}`} onClick={() => !item.isRead && read.mutate(item.id)} className="text-xs font-medium text-blue-600">Open {item.bug.bugCode}</Link> : null}{!item.isRead ? <button onClick={() => read.mutate(item.id)} className="text-xs text-slate-500">Mark read</button> : null}</div></div></div></div>) : <p className="p-8 text-center text-sm text-slate-500">No notifications yet.</p>}</div>{data && data.pagination.totalPages > 1 ? <nav aria-label="Notification pages" className="mt-4 flex items-center justify-between"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm text-slate-500">Page {page} of {data.pagination.totalPages}</span><button disabled={page === data.pagination.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40">Next</button></nav> : null}</div>;
}
