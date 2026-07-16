"use client";

import { useActionState } from "react";
import { addMemberAction, type ProjectActionState } from "@/features/projects/actions";

type UserOption = { id: string; fullName: string; email: string };

export function AddMemberForm({ projectId, users }: { projectId: string; users: UserOption[] }) {
  const [state, action, pending] = useActionState<ProjectActionState, FormData>(addMemberAction.bind(null, projectId), undefined);
  return <form action={action} className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Thêm thành viên</h2><p className="mt-1 text-sm text-slate-500">Chỉ hiển thị người dùng đang hoạt động và chưa thuộc dự án.</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]"><select name="userId" required className="h-10 rounded-lg border bg-white px-3 text-sm"><option value="">Chọn người dùng</option>{users.map((user) => <option key={user.id} value={user.id}>{user.fullName} · {user.email}</option>)}</select><select name="role" className="h-10 rounded-lg border bg-white px-3 text-sm">{["DEVELOPER","TESTER","VIEWER","MANAGER"].map((role) => <option key={role}>{role}</option>)}</select><button disabled={pending || users.length === 0} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-50">{pending ? "Đang thêm…" : "Thêm thành viên"}</button></div>{state?.message ? <p className={`mt-3 text-sm ${state.success ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p> : null}</form>;
}
