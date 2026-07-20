"use client";

import { useActionState, useEffect, useState } from "react";
import { changePasswordAction, updateProfileAction } from "@/features/users/actions";
import { AuthField } from "@/components/auth/auth-field";
import { UserAvatar } from "@/components/users/user-avatar";

function Message({ state }: { state: { success: boolean; message: string } | undefined }) {
  return state ? <p role="status" className={`rounded-lg p-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null;
}

export function ProfileForm({ user, maxAvatarMb }: { user: { fullName: string; username: string; avatarUrl: string | null }; maxAvatarMb: number }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <form action={action} className="space-y-4 rounded-xl border bg-white p-6"><div><h2 className="font-semibold">Thông tin hồ sơ</h2><p className="mt-1 text-sm text-slate-500">Cập nhật thông tin hiển thị công khai của bạn.</p></div><div className="flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center"><UserAvatar name={user.fullName} avatarUrl={preview ?? user.avatarUrl} size="lg" /><div className="min-w-0 flex-1"><label htmlFor="avatar" className="text-sm font-medium text-slate-700">Ảnh đại diện</label><input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" disabled={pending} onChange={(event) => { const file = event.target.files?.[0]; setAvatarError(""); if (!file) { setPreview(null); return; } if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) { setAvatarError("Chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc WEBP"); event.target.value = ""; setPreview(null); return; } if (file.size > maxAvatarMb * 1024 * 1024) { setAvatarError(`Ảnh phải nhỏ hơn hoặc bằng ${maxAvatarMb} MB`); event.target.value = ""; setPreview(null); return; } setPreview(URL.createObjectURL(file)); }} className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:font-medium file:text-white disabled:opacity-60" /><p className="mt-2 text-xs text-slate-500">JPG, JPEG, PNG hoặc WEBP; tối đa {maxAvatarMb} MB. Nếu chưa tải ảnh, hệ thống dùng avatar mặc định.</p>{avatarError ? <p role="alert" className="mt-1 text-xs text-red-600">{avatarError}</p> : null}</div></div><AuthField id="fullName" name="fullName" label="Họ và tên" defaultValue={user.fullName} error={state?.fieldErrors?.fullName} /><AuthField id="username" name="username" label="Tên người dùng" defaultValue={user.username} error={state?.fieldErrors?.username} /><Message state={state} /><button disabled={pending || Boolean(avatarError)} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-60">{pending ? "Đang tải ảnh và lưu…" : "Lưu hồ sơ"}</button></form>;
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return <form action={action} className="space-y-4 rounded-xl border bg-white p-6"><div><h2 className="font-semibold">Đổi mật khẩu</h2><p className="mt-1 text-sm text-slate-500">Sử dụng ít nhất tám ký tự và kết hợp nhiều loại ký tự.</p></div><AuthField id="currentPassword" name="currentPassword" type="password" label="Mật khẩu hiện tại" autoComplete="current-password" error={state?.fieldErrors?.currentPassword} /><AuthField id="newPassword" name="newPassword" type="password" label="Mật khẩu mới" autoComplete="new-password" error={state?.fieldErrors?.newPassword} /><AuthField id="confirmPassword" name="confirmPassword" type="password" label="Xác nhận mật khẩu mới" autoComplete="new-password" error={state?.fieldErrors?.confirmPassword} /><Message state={state} /><button disabled={pending} className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60">{pending ? "Đang cập nhật…" : "Cập nhật mật khẩu"}</button></form>;
}
