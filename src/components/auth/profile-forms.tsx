"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/features/users/actions";
import { AuthField } from "@/components/auth/auth-field";

function Message({ state }: { state: { success: boolean; message: string } | undefined }) {
  return state ? <p role="status" className={`rounded-lg p-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null;
}

export function ProfileForm({ user }: { user: { fullName: string; username: string; avatarUrl: string | null } }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  return <form action={action} className="space-y-4 rounded-xl border bg-white p-6"><div><h2 className="font-semibold">Profile information</h2><p className="mt-1 text-sm text-slate-500">Update your public identity.</p></div><AuthField id="fullName" name="fullName" label="Full name" defaultValue={user.fullName} error={state?.fieldErrors?.fullName} /><AuthField id="username" name="username" label="Username" defaultValue={user.username} error={state?.fieldErrors?.username} /><AuthField id="avatarUrl" name="avatarUrl" type="url" label="Avatar URL" defaultValue={user.avatarUrl ?? ""} error={state?.fieldErrors?.avatarUrl} /><Message state={state} /><button disabled={pending} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-60">{pending ? "Saving…" : "Save profile"}</button></form>;
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return <form action={action} className="space-y-4 rounded-xl border bg-white p-6"><div><h2 className="font-semibold">Change password</h2><p className="mt-1 text-sm text-slate-500">Use at least eight characters with mixed character types.</p></div><AuthField id="currentPassword" name="currentPassword" type="password" label="Current password" autoComplete="current-password" error={state?.fieldErrors?.currentPassword} /><AuthField id="newPassword" name="newPassword" type="password" label="New password" autoComplete="new-password" error={state?.fieldErrors?.newPassword} /><AuthField id="confirmPassword" name="confirmPassword" type="password" label="Confirm new password" autoComplete="new-password" error={state?.fieldErrors?.confirmPassword} /><Message state={state} /><button disabled={pending} className="h-10 rounded-lg bg-slate-950 px-4 text-sm font-medium text-white disabled:opacity-60">{pending ? "Updating…" : "Update password"}</button></form>;
}
