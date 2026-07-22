"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCirclePlus, MessagesSquare, Send } from "lucide-react";

type User = { id: string; fullName: string; username: string; systemRole: string };
type Conversation = { id: string; type: "PROJECT" | "DIRECT" | "SUPPORT"; displayName: string; unreadCount: number; canSend: boolean; updatedAt: string; messages: { content: string; createdAt: string }[] };
type Message = { id: string; content: string; createdAt: string; sender: User };
type Envelope<T> = { success: boolean; message: string; data: T };
type Candidates = { projects: { id: string; code: string; name: string }[]; directUsers: User[]; admins: User[] };
type ChatInit = { currentUser: { id: string; systemRole: string }; conversations: Conversation[]; candidates: Candidates };

class ChatRequestError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = "ChatRequestError"; }
}

async function json<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null) as Envelope<T> | null;
  if (!response.ok) throw new ChatRequestError(body?.message || "Yêu cầu chat không thành công", response.status);
  if (!body) throw new ChatRequestError("Phản hồi chat không hợp lệ", 500);
  return body.data;
}

function loadError(error: unknown, resource: "hội thoại" | "tin nhắn" | "danh sách người dùng" | "dữ liệu Chat") {
  if (error instanceof ChatRequestError && error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (error instanceof ChatRequestError && error.status === 403) return "Bạn không có quyền truy cập tính năng chat.";
  if (error instanceof ChatRequestError && error.status >= 500) return error.message;
  return `Không thể tải ${resource}. Vui lòng thử lại.`;
}

export function ChatWorkspace({ initialConversationId }: { initialConversationId?: string }) {
  const init = useQuery({ queryKey: ["chat", "init"], queryFn: () => json<ChatInit>("/api/chat/init"), retry: false });
  if (init.isPending || (init.isError && init.isFetching)) return <div className="grid min-h-[70vh] place-items-center rounded-2xl border bg-white"><p className="text-sm text-slate-500">Đang khởi tạo Chat…</p></div>;
  if (init.isError) return <div className="grid min-h-[70vh] place-items-center rounded-2xl border bg-white p-6"><div className="max-w-md text-center"><h2 className="font-semibold">Không thể khởi tạo Chat</h2><p className="mt-2 text-sm text-red-700">{loadError(init.error, "dữ liệu Chat")}</p><button type="button" onClick={() => void init.refetch()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Thử lại</button></div></div>;
  return <ChatWorkspaceReady
    currentUserId={init.data.currentUser.id}
    currentUserRole={init.data.currentUser.systemRole}
    initialConversationId={initialConversationId}
    initialConversations={init.data.conversations}
    initialCandidates={init.data.candidates}
  />;
}

function ChatWorkspaceReady({ currentUserId, currentUserRole, initialConversationId, initialConversations, initialCandidates }: { currentUserId: string; currentUserRole: string; initialConversationId?: string; initialConversations: Conversation[]; initialCandidates: Candidates }) {
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState(initialConversationId ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<"PROJECT" | "DIRECT" | "SUPPORT">("PROJECT");
  const [target, setTarget] = useState("");
  const [content, setContent] = useState("");
  const [notice, setNotice] = useState("");

  const conversations = useQuery({ queryKey: ["chat", "conversations"], queryFn: () => json<Conversation[]>("/api/conversations"), initialData: initialConversations, refetchInterval: 5_000 });
  const candidates = useQuery({ queryKey: ["chat", "candidates"], queryFn: () => json<Candidates>("/api/chat/candidates"), initialData: initialCandidates });
  const conversationItems = Array.isArray(conversations.data) ? conversations.data : [];
  const activeId = selectedId || conversationItems[0]?.id || "";
  const messages = useQuery({ queryKey: ["chat", "messages", activeId], enabled: Boolean(activeId), queryFn: () => json<{ items: Message[]; nextCursor: string | null }>(`/api/conversations/${activeId}/messages?limit=50`), refetchInterval: 4_000 });
  useEffect(() => {
    if (!activeId || !messages.data) return;
    void fetch(`/api/conversations/${activeId}/read`, { method: "PATCH" }).then(() => client.invalidateQueries({ queryKey: ["chat", "conversations"] }));
  }, [activeId, messages.data, client]);

  const create = useMutation({
    mutationFn: () => json<{ id: string }>("/api/conversations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(createType === "PROJECT" ? { type: createType, projectId: target } : { type: createType, targetUserId: target }) }),
    onSuccess: (data) => { setSelectedId(data.id); setShowCreate(false); setTarget(""); setNotice(""); void client.invalidateQueries({ queryKey: ["chat"] }); },
    onError: (error) => setNotice(error.message),
  });
  const send = useMutation({
    mutationFn: () => json<Message>(`/api/conversations/${activeId}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content, clientId: crypto.randomUUID() }) }),
    onSuccess: () => { setContent(""); setNotice(""); void client.invalidateQueries({ queryKey: ["chat"] }); },
    onError: (error) => setNotice(error.message),
  });
  const selected = conversationItems.find((item) => item.id === activeId);
  const options = createType === "PROJECT" ? candidates.data?.projects ?? [] : createType === "DIRECT" ? candidates.data?.directUsers ?? [] : candidates.data?.admins ?? [];

  return <div className="grid min-h-[70vh] overflow-hidden rounded-2xl border bg-white lg:grid-cols-[320px_minmax(0,1fr)]">
    <aside className="border-b lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between border-b p-4"><div><h1 className="font-semibold">Trò chuyện</h1><p className="text-xs text-slate-500">Cập nhật mỗi 4–5 giây</p></div><button type="button" onClick={() => setShowCreate((value) => !value)} aria-label="Mở hội thoại mới" className="grid size-9 place-items-center rounded-lg bg-blue-600 text-white"><MessageCirclePlus className="size-4" /></button></div>
      {showCreate ? <div className="space-y-3 border-b bg-slate-50 p-4"><label className="block text-xs font-medium">Loại hội thoại<select value={createType} onChange={(event) => { setCreateType(event.target.value as typeof createType); setTarget(""); }} className="mt-1 h-9 w-full rounded-lg border bg-white px-2 text-sm"><option value="PROJECT">Dự án</option>{currentUserRole !== "ADMIN" ? <><option value="DIRECT">Trực tiếp</option><option value="SUPPORT">Hỗ trợ Admin</option></> : null}</select></label>{candidates.isLoading ? <p className="text-xs text-slate-500">Đang tải danh sách người dùng…</p> : candidates.isError ? <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700"><p>{loadError(candidates.error, "danh sách người dùng")}</p><button type="button" onClick={() => void candidates.refetch()} className="mt-2 font-medium underline">Thử lại</button></div> : <label className="block text-xs font-medium">Đối tượng<select value={target} onChange={(event) => setTarget(event.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-white px-2 text-sm"><option value="">Chọn…</option>{options.map((item) => <option key={item.id} value={item.id}>{"code" in item ? `${item.code} · ${item.name}` : item.fullName}</option>)}</select></label>}<button type="button" onClick={() => create.mutate()} disabled={!target || create.isPending || candidates.isError} className="h-9 w-full rounded-lg bg-slate-900 text-sm text-white disabled:opacity-50">{create.isPending ? "Đang mở…" : "Mở hội thoại"}</button></div> : null}
      <div className="max-h-72 overflow-y-auto lg:max-h-[calc(70vh-73px)]">{conversations.isLoading ? <p className="p-5 text-sm text-slate-500">Đang tải hội thoại…</p> : conversations.isError ? <div className="p-5 text-sm text-red-700"><p>{loadError(conversations.error, "hội thoại")}</p><button type="button" onClick={() => void conversations.refetch()} className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium">Thử lại</button></div> : conversationItems.length ? conversationItems.map((item) => <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`flex w-full gap-3 border-b p-4 text-left ${activeId === item.id ? "bg-blue-50" : "hover:bg-slate-50"}`}><span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100"><MessagesSquare className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="truncate text-sm">{item.displayName}</strong>{item.unreadCount ? <span className="rounded-full bg-blue-600 px-1.5 text-[10px] leading-4 text-white">{item.unreadCount}</span> : null}</span><span className="mt-1 block truncate text-xs text-slate-500">{item.messages[0]?.content ?? "Chưa có tin nhắn"}</span></span></button>) : <p className="p-6 text-center text-sm text-slate-500">Chưa có cuộc trò chuyện</p>}</div>
    </aside>
    <section className="flex min-h-[520px] flex-col">
      {selected ? <><header className="border-b p-4"><h2 className="font-semibold">{selected.displayName}</h2><p className="text-xs text-slate-500">{selected.type === "PROJECT" ? "Hội thoại dự án" : selected.type === "SUPPORT" ? "Kênh hỗ trợ quản trị" : "Hội thoại trực tiếp"}</p></header><div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.isLoading ? <p className="text-sm text-slate-500">Đang tải tin nhắn…</p> : messages.isError ? <div className="pt-16 text-center text-sm text-red-700"><p>{loadError(messages.error, "tin nhắn")}</p><button type="button" onClick={() => void messages.refetch()} className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium">Thử lại</button></div> : messages.data?.items.length ? messages.data.items.map((message) => <div key={message.id} className={`flex ${message.sender.id === currentUserId ? "justify-end" : "justify-start"}`}><article className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.sender.id === currentUserId ? "bg-blue-600 text-white" : "border bg-white text-slate-800"}`}><p className={`mb-1 text-[11px] ${message.sender.id === currentUserId ? "text-blue-100" : "text-slate-500"}`}>{message.sender.fullName}</p><p className="whitespace-pre-wrap break-words">{message.content}</p><time className={`mt-1 block text-[10px] ${message.sender.id === currentUserId ? "text-blue-100" : "text-slate-400"}`}>{new Date(message.createdAt).toLocaleString("vi-VN")}</time></article></div>) : <p className="pt-20 text-center text-sm text-slate-500">Chưa có tin nhắn trong hội thoại này.</p>}</div>{notice ? <p role="alert" className="border-t bg-red-50 px-4 py-2 text-sm text-red-700">{notice}</p> : null}{selected.canSend ? <form onSubmit={(event) => { event.preventDefault(); if (content.trim()) send.mutate(); }} className="flex gap-2 border-t p-4"><label className="sr-only" htmlFor="chat-message">Tin nhắn</label><textarea id="chat-message" value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={2} placeholder="Nhập tin nhắn…" className="min-w-0 flex-1 resize-none rounded-xl border p-3 text-sm" /><button disabled={send.isPending || !content.trim()} aria-label="Gửi tin nhắn" className="grid w-12 place-items-center rounded-xl bg-blue-600 text-white disabled:opacity-50"><Send className="size-4" /></button></form> : <p className="border-t bg-amber-50 p-4 text-center text-sm text-amber-800">Bạn có quyền xem nhưng không thể gửi tin nhắn trong dự án này.</p>}</> : <div className="grid flex-1 place-items-center p-8 text-center"><div><MessagesSquare className="mx-auto size-10 text-slate-300" /><h2 className="mt-4 font-semibold">Chọn một hội thoại</h2><p className="mt-1 text-sm text-slate-500">Tin nhắn được lưu trong hệ thống và cập nhật bằng polling.</p></div></div>}
    </section>
  </div>;
}
