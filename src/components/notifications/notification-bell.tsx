"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type Response = { success: true; data: { unreadCount: number } };
async function getUnread() { const response = await fetch("/api/notifications?page=1"); if (!response.ok) throw new Error("Không thể tải thông báo"); return (await response.json()) as Response; }
export function NotificationBell() { const { data } = useQuery({ queryKey: ["notifications", 1], queryFn: getUnread, refetchInterval: 30_000, refetchIntervalInBackground: false }); const count = data?.data.unreadCount ?? 0; return <Link href="/notifications" aria-label={`${count} thông báo chưa đọc`} className="relative grid size-9 place-items-center rounded-lg border text-slate-500 hover:bg-slate-50"><Bell className="size-4" />{count ? <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] leading-4 text-white">{count > 99 ? "99+" : count}</span> : null}</Link>; }
