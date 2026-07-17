"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Pencil, Plus, ShieldCheck, UnlockKeyhole, UserX, X } from "lucide-react";

type SystemRole = "ADMIN" | "PROJECT_MANAGER" | "TESTER" | "DEVELOPER";
type AccountStatus = "ACTIVE" | "INACTIVE" | "LOCKED";
export type AdminUserItem = { id: string; email: string; fullName: string; username: string; systemRole: SystemRole; accountStatus: AccountStatus; createdAt: Date | string };
type Notice = { tone: "success" | "error"; message: string } | null;

const roleLabels: Record<SystemRole, string> = { ADMIN: "Quản trị viên", PROJECT_MANAGER: "Quản lý dự án", TESTER: "Kiểm thử viên", DEVELOPER: "Lập trình viên" };
const statusLabels: Record<AccountStatus, string> = { ACTIVE: "Đang hoạt động", INACTIVE: "Đã vô hiệu hóa", LOCKED: "Đã khóa" };

async function request(url: string, options: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || "Không thể thực hiện thao tác");
  return body;
}

export function UserManagement({ users, currentUserId }: { users: AdminUserItem[]; currentUserId: string }) {
  const router = useRouter();
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);
  const [formUser, setFormUser] = useState<AdminUserItem | "create" | null>(null);
  const [confirmation, setConfirmation] = useState<{ user: AdminUserItem; status: AccountStatus } | null>(null);

  function notify(tone: "success" | "error", message: string) {
    setNotice({ tone, message });
    window.setTimeout(() => setNotice(null), 4000);
  }

  async function saveUser(formData: FormData) {
    setPending(true);
    try {
      const editing = formUser !== null && formUser !== "create";
      const payload = editing
        ? { fullName: formData.get("fullName"), username: formData.get("username"), email: formData.get("email") }
        : { fullName: formData.get("fullName"), username: formData.get("username"), email: formData.get("email"), password: formData.get("password"), systemRole: formData.get("systemRole") };
      await request(editing ? `/api/admin/users/${formUser.id}` : "/api/admin/users", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
      setFormUser(null);
      notify("success", editing ? "Đã cập nhật thông tin người dùng" : "Đã tạo tài khoản mới");
      router.refresh();
    } catch (error) { notify("error", error instanceof Error ? error.message : "Không thể lưu người dùng"); }
    finally { setPending(false); }
  }

  async function updateRole(user: AdminUserItem, systemRole: SystemRole) {
    setPending(true);
    try {
      await request(`/api/admin/users/${user.id}/role`, { method: "PATCH", body: JSON.stringify({ systemRole }) });
      notify("success", "Đã cập nhật vai trò hệ thống");
      router.refresh();
    } catch (error) { notify("error", error instanceof Error ? error.message : "Không thể cập nhật vai trò"); }
    finally { setPending(false); }
  }

  async function updateStatus() {
    if (!confirmation) return;
    setPending(true);
    try {
      await request(`/api/admin/users/${confirmation.user.id}/status`, { method: "PATCH", body: JSON.stringify({ accountStatus: confirmation.status }) });
      notify("success", "Đã cập nhật trạng thái tài khoản");
      setConfirmation(null);
      router.refresh();
    } catch (error) { notify("error", error instanceof Error ? error.message : "Không thể cập nhật trạng thái"); }
    finally { setPending(false); }
  }

  return <>
    <div className="mb-4 flex justify-end"><button onClick={() => setFormUser("create")} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white"><Plus className="size-4" />Tạo tài khoản</button></div>
    {users.length ? <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[880px] text-left text-sm"><thead className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Người dùng</th><th className="p-4">Vai trò hệ thống</th><th className="p-4">Trạng thái</th><th className="p-4">Ngày tạo</th><th className="p-4 text-right">Hành động</th></tr></thead><tbody className="divide-y">{users.map((user) => <tr key={user.id}><td className="p-4"><p className="font-medium">{user.fullName}{user.id === currentUserId ? " (Bạn)" : ""}</p><p className="mt-1 text-xs text-slate-500">{user.email} · @{user.username}</p></td><td className="p-4"><select aria-label={`Vai trò của ${user.fullName}`} value={user.systemRole} disabled={pending || user.id === currentUserId} onChange={(event) => updateRole(user, event.target.value as SystemRole)} className="h-9 rounded-lg border bg-white px-2 text-xs disabled:bg-slate-100">{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.accountStatus === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : user.accountStatus === "LOCKED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{statusLabels[user.accountStatus]}</span></td><td className="p-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td><td className="p-4"><div className="flex justify-end gap-2"><button aria-label={`Sửa ${user.fullName}`} onClick={() => setFormUser(user)} className="grid size-9 place-items-center rounded-lg border text-slate-600 hover:bg-slate-50"><Pencil className="size-4" /></button>{user.accountStatus === "LOCKED" ? <button aria-label={`Mở khóa ${user.fullName}`} onClick={() => setConfirmation({ user, status: "ACTIVE" })} className="grid size-9 place-items-center rounded-lg border text-emerald-700"><UnlockKeyhole className="size-4" /></button> : <button aria-label={`Khóa ${user.fullName}`} disabled={user.id === currentUserId} onClick={() => setConfirmation({ user, status: "LOCKED" })} className="grid size-9 place-items-center rounded-lg border text-red-600 disabled:opacity-30"><LockKeyhole className="size-4" /></button>}<button aria-label={`Vô hiệu hóa ${user.fullName}`} disabled={user.id === currentUserId || user.accountStatus === "INACTIVE"} onClick={() => setConfirmation({ user, status: "INACTIVE" })} className="grid size-9 place-items-center rounded-lg border text-slate-600 disabled:opacity-30"><UserX className="size-4" /></button></div></td></tr>)}</tbody></table></div> : <div className="grid min-h-64 place-items-center rounded-xl border border-dashed bg-white text-center"><div><ShieldCheck className="mx-auto size-9 text-slate-300" /><h2 className="mt-3 font-medium">Không tìm thấy người dùng</h2><p className="mt-1 text-sm text-slate-500">Hãy thay đổi từ khóa hoặc tạo tài khoản mới.</p></div></div>}
    {notice ? <div role="status" className={`fixed bottom-5 right-5 z-[60] max-w-sm rounded-lg px-4 py-3 text-sm text-white shadow-xl ${notice.tone === "success" ? "bg-emerald-700" : "bg-red-700"}`}>{notice.message}</div> : null}
    {formUser ? <div role="dialog" aria-modal="true" aria-labelledby="user-form-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><form action={saveUser} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><h2 id="user-form-title" className="text-lg font-semibold">{formUser === "create" ? "Tạo tài khoản" : "Chỉnh sửa người dùng"}</h2><p className="mt-1 text-sm text-slate-500">Thông tin được kiểm tra lại ở phía máy chủ.</p></div><button type="button" aria-label="Đóng" onClick={() => setFormUser(null)}><X className="size-5" /></button></div><div className="mt-6 grid gap-4"><label className="text-sm font-medium">Họ và tên<input name="fullName" required minLength={2} maxLength={100} defaultValue={formUser === "create" ? "" : formUser.fullName} className="mt-1.5 h-10 w-full rounded-lg border px-3 font-normal" /></label><label className="text-sm font-medium">Tên người dùng<input name="username" required minLength={3} maxLength={30} pattern="[a-z0-9_]+" defaultValue={formUser === "create" ? "" : formUser.username} className="mt-1.5 h-10 w-full rounded-lg border px-3 font-normal" /></label><label className="text-sm font-medium">Email<input name="email" type="email" required defaultValue={formUser === "create" ? "" : formUser.email} className="mt-1.5 h-10 w-full rounded-lg border px-3 font-normal" /></label>{formUser === "create" ? <><label className="text-sm font-medium">Mật khẩu<input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-1.5 h-10 w-full rounded-lg border px-3 font-normal" /></label><label className="text-sm font-medium">Vai trò hệ thống<select name="systemRole" defaultValue="TESTER" className="mt-1.5 h-10 w-full rounded-lg border bg-white px-3 font-normal">{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></> : null}</div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setFormUser(null)} className="h-10 rounded-lg border px-4 text-sm">Hủy</button><button disabled={pending} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-60">{pending ? "Đang lưu…" : "Lưu"}</button></div></form></div> : null}
    {confirmation ? <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 id="confirm-title" className="text-lg font-semibold">Xác nhận thay đổi trạng thái</h2><p className="mt-2 text-sm leading-6 text-slate-600">Bạn có chắc muốn chuyển tài khoản <strong>{confirmation.user.fullName}</strong> sang “{statusLabels[confirmation.status]}”?</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => setConfirmation(null)} className="h-10 rounded-lg border px-4 text-sm">Hủy</button><button disabled={pending} onClick={updateStatus} className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white disabled:opacity-60">{pending ? "Đang xử lý…" : "Xác nhận"}</button></div></div></div> : null}
  </>;
}
