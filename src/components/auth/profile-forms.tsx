"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/features/users/actions";
import { AuthField } from "@/components/auth/auth-field";

function Message({ state }: { state: { success: boolean; message: string } | undefined }) {
  return state ? <p role="status" className={`rounded-lg p-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null;
}

export function ProfileForm({ user }: { user: { fullName: string; username: string; avatarUrl: string | null } }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  return <form action={action} className="space-y-4 rounded-xl border bg-white p-6"><div><h2 className="font-semibold">Thông tin hồ sơ</h2><p className="mt-1 text-sm text-slate-500">Cập nhật thông tin hiển thị công khai của bạn.</p></div><AuthField id="fullName" name="fullName" label="Họ và tên" defaultValue={user.fullName} error={state?.fieldErrors?.fullName} /><AuthField id="username" name="username" label="Tên người dùng" defaultValue={user.username} error={state?.fieldErrors?.username} /><AuthField id="avatarUrl" name="avatarUrl" type="url" label="Đường dẫn ảnh đại diện" defaultValue={user.avatarUrl ?? ""} error={state?.fieldErrors?.avatarUrl} /><Message state={state} /><button disabled={pending} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-60">{pending ? "Đang lưu…" : "Lưu hồ sơ"}</button></form>;
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return <form action={action} className="space-y-4 rounded-xl border bg-white p-6"><div><h2 className="font-semibold">Đổi mật khẩu</h2><p className="mt-1 text-sm text-slate-500">Sử dụng ít nhất tám ký tự và kết hợp nhiều loại ký tự.</p></div><AuthField id="currentPassword" name="currentPassword" type="password" label="Mật khẩu hiện tại" autoComplete="current-password" error={state?.fieldErrors?.currentPassword} /><AuthField id="newPassword" name="newPassword" type="password" label="Mật khẩu mới" autoComplete="new-password" error={state?.fieldErrors?.newPassword} /><AuthField id="confirmPassword" name="confirmPassword" type="password" label="Xác nhận mật khẩu mới" autoComplete="new-password" error={state?.fieldErrors?.confirmPassword} /><Message state={state} /><button disabled={pending} className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60">{pending ? "Đang cập nhật…" : "Cập nhật mật khẩu"}</button></form>;
}
