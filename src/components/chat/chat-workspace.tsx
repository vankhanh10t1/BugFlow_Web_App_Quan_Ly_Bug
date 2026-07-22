"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Camera, CheckCheck, CircleEllipsis, Copy, FileUp, Info, Laugh, MessageCirclePlus, MessagesSquare, Pin, Send, ShieldAlert, Star, Trash2, Undo2, X } from "lucide-react";

type User = { id: string; fullName: string; username: string; systemRole: string };
type Priority = "NORMAL" | "IMPORTANT" | "URGENT";
type Delivery = "UNSENT" | "SENT" | "DELIVERED" | "READ" | "FAILED";
type MessageType = "TEXT" | "EMOJI" | "STICKER" | "IMAGE" | "FILE" | "REMINDER";
type Conversation = { id: string; type: "PROJECT" | "DIRECT" | "SUPPORT"; displayName: string; unreadCount: number; canSend: boolean; updatedAt: string; messages: { content: string; createdAt: string }[] };
type Message = { id: string; clientId?: string | null; content: string; type: MessageType; priority: Priority; sticker?: string | null; attachmentUrl?: string | null; attachmentName?: string | null; attachmentMime?: string | null; attachmentSize?: number | null; reminderAt?: string | null; pinnedAt?: string | null; recalledAt?: string | null; marked?: boolean; deliveryStatus?: Delivery | null; createdAt: string; sender: User; pending?: boolean; failed?: boolean };
type Envelope<T> = { success: boolean; message: string; data: T };
type Candidates = { projects: { id: string; code: string; name: string }[]; directUsers: User[]; admins: User[] };
type ChatInit = { currentUser: { id: string; systemRole: string }; conversations: Conversation[]; candidates: Candidates };
type ConversationInfo = {
  reminders: Message[];
  media: Message[];
  files: Message[];
  links: { messageId: string; url: string; createdAt: string }[];
  pinned: Message[];
  settings: { hidden: boolean; autoDeleteSeconds: number };
};

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

function loadError(error: unknown, resource: string) {
  if (error instanceof ChatRequestError && error.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (error instanceof ChatRequestError && error.status === 403) return "Bạn không có quyền truy cập tính năng chat.";
  if (error instanceof ChatRequestError && error.status >= 500) return error.message;
  return `Không thể tải ${resource}. Vui lòng thử lại.`;
}

const emojis = ["😀", "😂", "😍", "👍", "👏", "🎉", "❤️", "🙏", "🔥", "✅"];
const stickers = ["🎉", "👍", "❤️", "😂", "🥳", "💪", "🚀", "🌟"];
const statusText: Record<Delivery, string> = { UNSENT: "Chưa gửi", SENT: "Đã gửi", DELIVERED: "Đã nhận", READ: "Đã xem", FAILED: "Gửi lỗi" };

export function ChatWorkspace({ initialConversationId }: { initialConversationId?: string }) {
  const init = useQuery({ queryKey: ["chat", "init"], queryFn: () => json<ChatInit>("/api/chat/init"), retry: false });
  if (init.isPending || (init.isError && init.isFetching)) return <div className="grid min-h-[70vh] place-items-center rounded-2xl border bg-white"><p className="text-sm text-slate-500">Đang khởi tạo Chat…</p></div>;
  if (init.isError) return <div className="grid min-h-[70vh] place-items-center rounded-2xl border bg-white p-6"><div className="max-w-md text-center"><h2 className="font-semibold">Không thể khởi tạo Chat</h2><p className="mt-2 text-sm text-red-700">{loadError(init.error, "dữ liệu Chat")}</p><button type="button" onClick={() => void init.refetch()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Thử lại</button></div></div>;
  return <ChatWorkspaceReady currentUserId={init.data.currentUser.id} currentUserRole={init.data.currentUser.systemRole} initialConversationId={initialConversationId} initialConversations={init.data.conversations} initialCandidates={init.data.candidates} />;
}

function ChatWorkspaceReady({ currentUserId, currentUserRole, initialConversationId, initialConversations, initialCandidates }: { currentUserId: string; currentUserRole: string; initialConversationId?: string; initialConversations: Conversation[]; initialCandidates: Candidates }) {
  const client = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState(initialConversationId ?? "");
  const [showCreate, setShowCreate] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [createType, setCreateType] = useState<"PROJECT" | "DIRECT" | "SUPPORT">("PROJECT");
  const [target, setTarget] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<Priority>("NORMAL");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSticker, setShowSticker] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderAt, setReminderAt] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [reportReason, setReportReason] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const conversations = useQuery({ queryKey: ["chat", "conversations"], queryFn: () => json<Conversation[]>("/api/conversations"), initialData: initialConversations, refetchInterval: 5_000 });
  const candidates = useQuery({ queryKey: ["chat", "candidates"], queryFn: () => json<Candidates>("/api/chat/candidates"), initialData: initialCandidates });
  const conversationItems = Array.isArray(conversations.data) ? conversations.data : [];
  const activeId = selectedId || conversationItems[0]?.id || "";
  const selected = conversationItems.find((item) => item.id === activeId);
  const messages = useQuery({ queryKey: ["chat", "messages", activeId], enabled: Boolean(activeId), queryFn: () => json<{ items: Message[]; nextCursor: string | null }>(`/api/conversations/${activeId}/messages?limit=100`), refetchInterval: 4_000 });
  const info = useQuery({ queryKey: ["chat", "info", activeId], enabled: Boolean(activeId && showInfo), queryFn: () => json<ConversationInfo>(`/api/conversations/${activeId}/info`) });

  useEffect(() => {
    if (!activeId || !messages.data) return;
    void fetch(`/api/conversations/${activeId}/read`, { method: "PATCH" }).then(() => client.invalidateQueries({ queryKey: ["chat", "conversations"] }));
  }, [activeId, messages.data, client]);

  const refreshChat = () => {
    void client.invalidateQueries({ queryKey: ["chat", "conversations"] });
    void client.invalidateQueries({ queryKey: ["chat", "messages", activeId] });
    void client.invalidateQueries({ queryKey: ["chat", "info", activeId] });
  };

  const create = useMutation({
    mutationFn: () => json<{ id: string }>("/api/conversations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(createType === "PROJECT" ? { type: createType, projectId: target } : { type: createType, targetUserId: target }) }),
    onSuccess: (data) => { setSelectedId(data.id); setShowCreate(false); setTarget(""); setNotice(""); void client.invalidateQueries({ queryKey: ["chat"] }); },
    onError: (error) => setNotice(error.message),
  });

  type SendInput = { clientId: string; content: string; type: "TEXT" | "EMOJI" | "STICKER" | "REMINDER"; priority: Priority; sticker?: string; reminderAt?: string };
  const send = useMutation({
    mutationFn: (input: SendInput) => json<Message>(`/api/conversations/${activeId}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }),
    onMutate: (input) => {
      const optimistic: Message = { id: input.clientId, clientId: input.clientId, content: input.content, type: input.type, priority: input.priority, sticker: input.sticker, reminderAt: input.reminderAt, createdAt: new Date().toISOString(), sender: { id: currentUserId, fullName: "Bạn", username: "", systemRole: currentUserRole }, deliveryStatus: "UNSENT", pending: true };
      setPendingMessages((items) => [...items.filter((item) => item.clientId !== input.clientId), optimistic]);
      setNotice("");
    },
    onSuccess: (_, input) => { setPendingMessages((items) => items.filter((item) => item.clientId !== input.clientId)); setContent(""); setReminderAt(""); setShowReminder(false); refreshChat(); },
    onError: (error, input) => { setPendingMessages((items) => items.map((item) => item.clientId === input.clientId ? { ...item, pending: false, failed: true, deliveryStatus: "FAILED" } : item)); setNotice(error.message); },
  });

  const upload = useMutation({
    mutationFn: async ({ file, clientId }: { file: File; clientId: string }) => {
      const form = new FormData(); form.set("file", file); form.set("priority", priority); form.set("clientId", clientId);
      return json<Message>(`/api/conversations/${activeId}/attachments`, { method: "POST", body: form });
    },
    onMutate: ({ file, clientId }) => setPendingMessages((items) => [...items, { id: clientId, clientId, content: file.name, type: file.type.startsWith("image/") ? "IMAGE" : "FILE", priority, attachmentName: file.name, createdAt: new Date().toISOString(), sender: { id: currentUserId, fullName: "Bạn", username: "", systemRole: currentUserRole }, deliveryStatus: "UNSENT", pending: true }]),
    onSuccess: (_, input) => { setPendingMessages((items) => items.filter((item) => item.clientId !== input.clientId)); refreshChat(); },
    onError: (error, input) => { setPendingMessages((items) => items.map((item) => item.clientId === input.clientId ? { ...item, pending: false, failed: true, deliveryStatus: "FAILED" } : item)); setNotice(error.message); },
  });

  const action = useMutation({
    mutationFn: ({ messageId, actionName }: { messageId: string; actionName: string }) => json<unknown>(`/api/conversations/${activeId}/messages/${messageId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: actionName }) }),
    onSuccess: () => { setNotice(""); refreshChat(); }, onError: (error) => setNotice(error.message),
  });
  const bulk = useMutation({
    mutationFn: (actionName: "MARK" | "UNMARK" | "DELETE_FOR_ME") => json<unknown>(`/api/conversations/${activeId}/messages/bulk`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: actionName, messageIds: [...selectedMessages] }) }),
    onSuccess: () => { setSelectedMessages(new Set()); refreshChat(); }, onError: (error) => setNotice(error.message),
  });
  const settings = useMutation({
    mutationFn: (body: object) => json<unknown>(`/api/conversations/${activeId}/settings`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => { setConfirmClear(false); setNotice("Đã cập nhật thiết lập hội thoại."); refreshChat(); }, onError: (error) => setNotice(error.message),
  });
  const report = useMutation({
    mutationFn: () => json<unknown>(`/api/conversations/${activeId}/report`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason: reportReason }) }),
    onSuccess: () => { setReportReason(""); setNotice("Đã gửi báo xấu tới quản trị viên."); }, onError: (error) => setNotice(error.message),
  });

  const sendText = (override?: Partial<SendInput>) => {
    const type = override?.type ?? (showReminder ? "REMINDER" : "TEXT");
    const text = override?.content ?? content.trim();
    if (type !== "STICKER" && !text) return;
    send.mutate({ clientId: crypto.randomUUID(), content: text, type, priority, ...(type === "REMINDER" ? { reminderAt: new Date(reminderAt).toISOString() } : {}), ...override });
  };

  const captureScreen = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Trình duyệt không hỗ trợ chụp màn hình. Hãy tải ảnh lên thủ công.");
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement("video"); video.srcObject = stream; await video.play();
      const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0); stream.getTracks().forEach((track) => track.stop());
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Không thể tạo ảnh chụp màn hình.");
      upload.mutate({ file: new File([blob], `anh-chup-${Date.now()}.png`, { type: "image/png" }), clientId: crypto.randomUUID() });
    } catch (error) { setNotice(error instanceof Error ? error.message : "Không thể chụp màn hình."); }
  };

  const retryPending = (message: Message) => {
    if (message.type === "IMAGE" || message.type === "FILE") { setNotice("Hãy chọn lại tệp bằng nút Ảnh hoặc file vì trình duyệt không giữ nội dung tệp sau khi lỗi."); return; }
    sendText({ clientId: message.clientId ?? crypto.randomUUID(), content: message.content, type: message.type as SendInput["type"], priority: message.priority, sticker: message.sticker ?? undefined, reminderAt: message.reminderAt ?? undefined });
  };

  const options = createType === "PROJECT" ? candidates.data?.projects ?? [] : createType === "DIRECT" ? candidates.data?.directUsers ?? [] : candidates.data?.admins ?? [];
  const allMessages = [...(messages.data?.items ?? []), ...pendingMessages];

  return <div className={`grid min-h-[70vh] overflow-hidden rounded-2xl border bg-white ${showInfo ? "lg:grid-cols-[280px_minmax(0,1fr)_320px]" : "lg:grid-cols-[320px_minmax(0,1fr)]"}`}>
    <aside className="border-b lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">Trò chuyện</h2><p className="text-xs text-slate-500">Cập nhật mỗi 4–5 giây</p></div><button type="button" onClick={() => setShowCreate((value) => !value)} aria-label="Mở hội thoại mới" className="grid size-9 place-items-center rounded-lg bg-blue-600 text-white"><MessageCirclePlus className="size-4" /></button></div>
      {showCreate ? <div className="space-y-3 border-b bg-slate-50 p-4"><label className="block text-xs font-medium">Loại hội thoại<select value={createType} onChange={(event) => { setCreateType(event.target.value as typeof createType); setTarget(""); }} className="mt-1 h-9 w-full rounded-lg border bg-white px-2 text-sm"><option value="PROJECT">Dự án</option>{currentUserRole !== "ADMIN" ? <><option value="DIRECT">Trực tiếp</option><option value="SUPPORT">Hỗ trợ Admin</option></> : null}</select></label><label className="block text-xs font-medium">Đối tượng<select value={target} onChange={(event) => setTarget(event.target.value)} className="mt-1 h-9 w-full rounded-lg border bg-white px-2 text-sm"><option value="">Chọn…</option>{options.map((item) => <option key={item.id} value={item.id}>{"code" in item ? `${item.code} · ${item.name}` : item.fullName}</option>)}</select></label><button type="button" onClick={() => create.mutate()} disabled={!target || create.isPending} className="h-9 w-full rounded-lg bg-slate-900 text-sm text-white disabled:opacity-50">{create.isPending ? "Đang mở…" : "Mở hội thoại"}</button></div> : null}
      <div className="max-h-72 overflow-y-auto lg:max-h-[calc(70vh-73px)]">{conversations.isLoading ? <p className="p-5 text-sm text-slate-500">Đang tải hội thoại…</p> : conversations.isError ? <ErrorRetry message={loadError(conversations.error, "hội thoại")} retry={() => void conversations.refetch()} /> : conversationItems.length ? conversationItems.map((item) => <button type="button" key={item.id} onClick={() => { setSelectedId(item.id); setShowInfo(false); }} className={`flex w-full gap-3 border-b p-4 text-left ${activeId === item.id ? "bg-blue-50" : "hover:bg-slate-50"}`}><span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100"><MessagesSquare className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="truncate text-sm">{item.displayName}</strong>{item.unreadCount ? <span className="rounded-full bg-blue-600 px-1.5 text-[10px] leading-4 text-white">{item.unreadCount}</span> : null}</span><span className="mt-1 block truncate text-xs text-slate-500">{item.messages[0]?.content ?? "Chưa có tin nhắn"}</span></span></button>) : <p className="p-6 text-center text-sm text-slate-500">Chưa có cuộc trò chuyện</p>}</div>
    </aside>

    <section className="flex min-h-[560px] min-w-0 flex-col">
      {selected ? <>
        <header className="flex items-center gap-3 border-b p-4"><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{selected.displayName}</h2><p className="text-xs text-slate-500">{selected.type === "PROJECT" ? "Hội thoại dự án" : selected.type === "SUPPORT" ? "Kênh hỗ trợ quản trị" : "Hội thoại trực tiếp"}</p></div><button type="button" onClick={() => setShowInfo((value) => !value)} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"><Info className="size-4" />Thông tin</button></header>
        {selectedMessages.size ? <div className="flex flex-wrap items-center gap-2 border-b bg-blue-50 px-4 py-2 text-xs"><strong>{selectedMessages.size} tin đã chọn</strong><button onClick={() => bulk.mutate("MARK")} className="rounded border bg-white px-2 py-1">Đánh dấu</button><button onClick={() => bulk.mutate("DELETE_FOR_ME")} className="rounded border bg-white px-2 py-1">Xóa phía tôi</button><button onClick={() => setSelectedMessages(new Set())} className="ml-auto"><X className="size-4" /></button></div> : null}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.isLoading ? <p className="text-sm text-slate-500">Đang tải tin nhắn…</p> : messages.isError ? <ErrorRetry message={loadError(messages.error, "tin nhắn")} retry={() => void messages.refetch()} /> : allMessages.length ? allMessages.map((message) => <MessageBubble key={message.id} message={message} mine={message.sender.id === currentUserId} selected={selectedMessages.has(message.id)} toggleSelected={() => setSelectedMessages((current) => { const next = new Set(current); if (next.has(message.id)) next.delete(message.id); else next.add(message.id); return next; })} copy={() => { void navigator.clipboard.writeText(message.content); setNotice("Đã sao chép tin nhắn."); }} act={(actionName) => action.mutate({ messageId: message.id, actionName })} retry={() => retryPending(message)} />) : <p className="pt-20 text-center text-sm text-slate-500">Chưa có tin nhắn trong hội thoại này.</p>}</div>
        {notice ? <p role="status" className="border-t bg-amber-50 px-4 py-2 text-sm text-amber-800">{notice}</p> : null}
        {selected.canSend ? <div className="border-t p-3">
          {showEmoji ? <Picker items={emojis} choose={(item) => { setContent((value) => value + item); setShowEmoji(false); }} /> : null}
          {showSticker ? <Picker items={stickers} large choose={(item) => { sendText({ type: "STICKER", content: "", sticker: item }); setShowSticker(false); }} /> : null}
          {showReminder ? <div className="mb-2 grid gap-2 rounded-xl bg-blue-50 p-3 sm:grid-cols-2"><input type="datetime-local" value={reminderAt} onChange={(event) => setReminderAt(event.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm" /><p className="text-xs text-blue-700">Nhắc hẹn được lưu trong hội thoại. Tác vụ gửi thông báo đúng giờ là bước phát triển tiếp theo.</p></div> : null}
          <div className="mb-2 flex flex-wrap items-center gap-1"><ToolButton label="Emoji" onClick={() => setShowEmoji((value) => !value)}><Laugh /></ToolButton><ToolButton label="Sticker" onClick={() => setShowSticker((value) => !value)}><CircleEllipsis /></ToolButton><ToolButton label="Ảnh hoặc file" onClick={() => fileInput.current?.click()}><FileUp /></ToolButton><ToolButton label="Chụp màn hình" onClick={() => void captureScreen()}><Camera /></ToolButton><ToolButton label="Nhắc hẹn" onClick={() => setShowReminder((value) => !value)}><BellRing /></ToolButton><select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className="ml-auto h-9 rounded-lg border bg-white px-2 text-xs"><option value="NORMAL">Tin thường</option><option value="IMPORTANT">Quan trọng</option><option value="URGENT">Khẩn cấp</option></select><input ref={fileInput} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,text/plain,.log,.ndjson,application/pdf" onChange={(event) => { const file = event.target.files?.[0]; if (file) upload.mutate({ file, clientId: crypto.randomUUID() }); event.currentTarget.value = ""; }} /></div>
          <form onSubmit={(event) => { event.preventDefault(); sendText(); }} className="flex gap-2"><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={2000} rows={2} placeholder={showReminder ? "Nội dung nhắc hẹn…" : "Nhập tin nhắn…"} className="min-w-0 flex-1 resize-none rounded-xl border p-3 text-sm" /><button disabled={send.isPending || !content.trim() || (showReminder && !reminderAt)} aria-label="Gửi tin nhắn" className="grid w-12 place-items-center rounded-xl bg-blue-600 text-white disabled:opacity-50"><Send className="size-4" /></button></form>
          <p className="mt-2 text-[11px] text-slate-400">Chụp màn hình phụ thuộc quyền và bộ chọn nguồn của trình duyệt. Nếu không hỗ trợ, hãy tải ảnh lên thủ công.</p>
        </div> : <p className="border-t bg-amber-50 p-4 text-center text-sm text-amber-800">Bạn có quyền xem nhưng không thể gửi tin nhắn trong dự án này.</p>}
      </> : <div className="grid flex-1 place-items-center p-8 text-center"><div><MessagesSquare className="mx-auto size-10 text-slate-300" /><h2 className="mt-4 font-semibold">Chọn một hội thoại</h2><p className="mt-1 text-sm text-slate-500">Tin nhắn được lưu trong hệ thống và cập nhật bằng polling.</p></div></div>}
    </section>

    {showInfo && selected ? <ConversationInfoPanel info={info.data} loading={info.isLoading} error={info.isError ? loadError(info.error, "thông tin hội thoại") : ""} close={() => setShowInfo(false)} updateSettings={(body) => settings.mutate(body)} reportReason={reportReason} setReportReason={setReportReason} submitReport={() => report.mutate()} confirmClear={confirmClear} setConfirmClear={setConfirmClear} /> : null}
  </div>;
}

function MessageBubble({ message, mine, selected, toggleSelected, copy, act, retry }: { message: Message; mine: boolean; selected: boolean; toggleSelected: () => void; copy: () => void; act: (action: string) => void; retry: () => void }) {
  const delivery: Delivery = message.failed ? "FAILED" : message.pending ? "UNSENT" : message.deliveryStatus ?? "SENT";
  const recalled = Boolean(message.recalledAt);
  return <div className={`group flex items-start gap-2 ${mine ? "justify-end" : "justify-start"}`}>
    <input type="checkbox" checked={selected} onChange={toggleSelected} aria-label="Chọn tin nhắn" className="mt-4 size-4" />
    <article className={`relative max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${mine ? "bg-blue-600 text-white" : "border bg-white text-slate-800"} ${message.priority === "URGENT" ? "ring-2 ring-red-400" : message.priority === "IMPORTANT" ? "ring-2 ring-amber-300" : ""}`}>
      <div className="mb-1 flex items-center gap-2"><span className={`text-[11px] ${mine ? "text-blue-100" : "text-slate-500"}`}>{message.sender.fullName}</span>{message.priority === "IMPORTANT" ? <span className="rounded bg-amber-100 px-1.5 text-[10px] font-medium text-amber-800">Quan trọng</span> : null}{message.priority === "URGENT" ? <span className="rounded bg-red-100 px-1.5 text-[10px] font-medium text-red-700">Khẩn cấp</span> : null}{message.pinnedAt ? <Pin className="size-3" /> : null}{message.marked ? <Star className="size-3 fill-current" /> : null}</div>
      {recalled ? <p className="italic opacity-80">Tin nhắn đã được thu hồi</p> : message.type === "STICKER" ? <p className="text-5xl leading-none">{message.sticker}</p> : <><p className="whitespace-pre-wrap break-words">{message.content}</p>{message.type === "REMINDER" && message.reminderAt ? <p className={`mt-2 rounded-lg px-2 py-1 text-xs ${mine ? "bg-blue-500" : "bg-blue-50 text-blue-700"}`}><BellRing className="mr-1 inline size-3" />{new Date(message.reminderAt).toLocaleString("vi-VN")}</p> : null}{message.attachmentUrl && message.type === "IMAGE" && message.attachmentMime?.startsWith("video/") ? <video src={message.attachmentUrl} controls className="mt-2 max-h-64 max-w-full rounded-lg" /> : null}{message.attachmentUrl && message.type === "IMAGE" && !message.attachmentMime?.startsWith("video/") ? <a href={message.attachmentUrl} target="_blank" rel="noreferrer"><Image src={message.attachmentUrl} alt={message.attachmentName ?? "Ảnh trong chat"} width={420} height={280} unoptimized className="mt-2 max-h-64 w-auto rounded-lg object-contain" /></a> : null}{message.attachmentUrl && message.type === "FILE" ? <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-2 rounded-lg border p-2 text-xs ${mine ? "border-blue-400" : "bg-slate-50"}`}><FileUp className="size-4" /><span className="break-all">{message.attachmentName}</span></a> : null}</>}
      <div className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${mine ? "text-blue-100" : "text-slate-400"}`}><time>{new Date(message.createdAt).toLocaleString("vi-VN")}</time>{mine ? <span className="flex items-center gap-1"><CheckCheck className="size-3" />{statusText[delivery]}</span> : null}</div>
      {message.failed ? <button type="button" onClick={retry} className="mt-2 flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-xs text-red-600"><Undo2 className="size-3" />Gửi lại</button> : null}
    </article>
    {!message.pending ? <details className="relative mt-2"><summary className="cursor-pointer list-none rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Thao tác tin nhắn"><CircleEllipsis className="size-4" /></summary><div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border bg-white p-1 text-xs text-slate-700 shadow-xl"><MenuAction icon={<Copy />} label="Sao chép" action={copy} /><MenuAction icon={<Pin />} label={message.pinnedAt ? "Bỏ ghim" : "Ghim"} action={() => act(message.pinnedAt ? "UNPIN" : "PIN")} /><MenuAction icon={<Star />} label={message.marked ? "Bỏ đánh dấu" : "Đánh dấu"} action={() => act(message.marked ? "UNMARK" : "MARK")} /><MenuAction icon={<CheckCheck />} label="Chọn tin nhắn" action={toggleSelected} />{mine && !recalled ? <MenuAction icon={<Undo2 />} label="Thu hồi" action={() => act("RECALL")} /> : null}<MenuAction icon={<Trash2 />} label="Xóa phía tôi" action={() => act("DELETE_FOR_ME")} /></div></details> : null}
  </div>;
}

function ConversationInfoPanel({ info, loading, error, close, updateSettings, reportReason, setReportReason, submitReport, confirmClear, setConfirmClear }: { info?: ConversationInfo; loading: boolean; error: string; close: () => void; updateSettings: (body: object) => void; reportReason: string; setReportReason: (value: string) => void; submitReport: () => void; confirmClear: boolean; setConfirmClear: (value: boolean) => void }) {
  return <aside className="min-w-0 overflow-y-auto border-l bg-white p-4 lg:max-h-[70vh]"><div className="flex items-center justify-between"><h2 className="font-semibold">Thông tin hội thoại</h2><button onClick={close} aria-label="Đóng thông tin"><X className="size-4" /></button></div>{loading ? <p className="mt-6 text-sm text-slate-500">Đang tải…</p> : error ? <p className="mt-6 text-sm text-red-600">{error}</p> : info ? <div className="mt-4 space-y-5"><InfoSection title={`Tin ghim (${info.pinned.length})`}>{info.pinned.map((item) => <InfoRow key={item.id} text={item.content} />)}</InfoSection><InfoSection title={`Nhắc hẹn (${info.reminders.length})`}>{info.reminders.map((item) => <InfoRow key={item.id} text={`${item.content} · ${item.reminderAt ? new Date(item.reminderAt).toLocaleString("vi-VN") : ""}`} />)}</InfoSection><InfoSection title={`Ảnh/video (${info.media.length})`}><div className="grid grid-cols-3 gap-2">{info.media.map((item) => item.attachmentUrl ? <a key={item.id} href={item.attachmentUrl} target="_blank" rel="noreferrer">{item.attachmentMime?.startsWith("video/") ? <video src={item.attachmentUrl} muted className="aspect-square rounded object-cover" /> : <Image src={item.attachmentUrl} alt={item.attachmentName ?? "Media"} width={96} height={96} unoptimized className="aspect-square rounded object-cover" />}</a> : null)}</div></InfoSection><InfoSection title={`File (${info.files.length})`}>{info.files.map((item) => <a key={item.id} href={item.attachmentUrl ?? "#"} target="_blank" rel="noreferrer" className="block truncate text-xs text-blue-600">{item.attachmentName}</a>)}</InfoSection><InfoSection title={`Liên kết (${info.links.length})`}>{info.links.map((item) => <a key={`${item.messageId}-${item.url}`} href={item.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-blue-600">{item.url}</a>)}</InfoSection><InfoSection title="Thiết lập bảo mật"><label className="block text-xs">Tin nhắn tự ẩn phía tôi<select value={info.settings.autoDeleteSeconds} onChange={(event) => updateSettings({ autoDeleteSeconds: Number(event.target.value) })} className="mt-1 w-full rounded-lg border px-2 py-2"><option value={0}>Tắt</option><option value={3600}>Sau 1 giờ</option><option value={86400}>Sau 1 ngày</option><option value={604800}>Sau 7 ngày</option><option value={2592000}>Sau 30 ngày</option></select></label><button onClick={() => updateSettings({ hidden: true })} className="mt-2 w-full rounded-lg border px-3 py-2 text-xs">Ẩn trò chuyện</button>{confirmClear ? <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700"><p>Chỉ ẩn lịch sử phía bạn, không xóa với người khác.</p><div className="mt-2 flex gap-2"><button onClick={() => updateSettings({ clearHistory: true })} className="rounded bg-red-600 px-2 py-1 text-white">Xác nhận</button><button onClick={() => setConfirmClear(false)} className="rounded border px-2 py-1">Hủy</button></div></div> : <button onClick={() => setConfirmClear(true)} className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-xs text-red-600">Xóa lịch sử phía tôi</button>}</InfoSection><InfoSection title="Báo xấu"><textarea value={reportReason} onChange={(event) => setReportReason(event.target.value)} maxLength={500} rows={3} placeholder="Mô tả lý do…" className="w-full rounded-lg border p-2 text-xs" /><button disabled={reportReason.trim().length < 5} onClick={submitReport} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs text-white disabled:opacity-40"><ShieldAlert className="size-3" />Gửi báo xấu</button></InfoSection></div> : null}</aside>;
}

function Picker({ items, choose, large = false }: { items: string[]; choose: (item: string) => void; large?: boolean }) { return <div className="mb-2 flex flex-wrap gap-1 rounded-xl border bg-white p-2 shadow-sm">{items.map((item) => <button type="button" key={item} onClick={() => choose(item)} className={`rounded-lg p-2 hover:bg-slate-100 ${large ? "text-3xl" : "text-xl"}`}>{item}</button>)}</div>; }
function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactElement<{ className?: string }> }) { return <button type="button" title={label} aria-label={label} onClick={onClick} className="grid size-9 place-items-center rounded-lg border text-slate-600 [&_svg]:size-4">{children}</button>; }
function MenuAction({ icon, label, action }: { icon: React.ReactElement<{ className?: string }>; label: string; action: () => void }) { return <button type="button" onClick={action} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-100 [&_svg]:size-3.5">{icon}{label}</button>; }
function ErrorRetry({ message, retry }: { message: string; retry: () => void }) { return <div className="p-5 text-sm text-red-700"><p>{message}</p><button type="button" onClick={retry} className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium">Thử lại</button></div>; }
function InfoSection({ title, children }: { title: string; children: React.ReactNode }) { return <section><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3><div className="space-y-2">{children}</div></section>; }
function InfoRow({ text }: { text: string }) { return <p className="line-clamp-2 rounded-lg bg-slate-50 p-2 text-xs">{text}</p>; }
