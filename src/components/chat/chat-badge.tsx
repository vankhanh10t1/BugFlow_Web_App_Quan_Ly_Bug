"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type ConversationSummary = { unreadCount: number };
type Result = { success: true; data: ConversationSummary[] };

export async function loadChatBadgeConversations() {
  const response = await fetch("/api/conversations");
  if (!response.ok) throw new Error("Không thể tải số tin nhắn chưa đọc");
  const body = await response.json() as Result;
  return body.data;
}

export function ChatBadge() {
  const { data } = useQuery({ queryKey: ["chat", "conversations"], queryFn: loadChatBadgeConversations, refetchInterval: 10_000, refetchIntervalInBackground: false });
  const count = data?.reduce((sum, item) => sum + item.unreadCount, 0) ?? 0;
  return <Link href="/chat" aria-label={`${count} tin nhắn chưa đọc`} className="relative grid size-9 place-items-center rounded-lg border text-slate-500 hover:bg-slate-50"><MessagesSquare className="size-4" />{count ? <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-blue-600 px-1 text-center text-[10px] leading-4 text-white">{count > 99 ? "99+" : count}</span> : null}</Link>;
}
