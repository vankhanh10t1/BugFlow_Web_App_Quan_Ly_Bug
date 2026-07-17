"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { cancelTwoFactorLoginAction, verifyTwoFactorLoginAction } from "@/features/auth/two-factor-actions";

export function TwoFactorLoginForm({ method }: { method: "totp" | "recovery" }) {
  const [state, action, pending] = useActionState(verifyTwoFactorLoginAction.bind(null, method), undefined);
  const recovery = method === "recovery";
  return <form action={action} className="space-y-4"><label htmlFor="verification" className="block text-sm font-medium text-slate-700">{recovery ? "Recovery code" : "Mã xác thực 6 chữ số"}<input id="verification" name="verification" autoFocus required inputMode={recovery ? "text" : "numeric"} autoComplete="one-time-code" pattern={recovery ? "[A-Fa-f0-9-]+" : "[0-9]{6}"} maxLength={recovery ? 39 : 6} placeholder={recovery ? "XXXX-XXXX-…" : "000000"} className="mt-1.5 h-12 w-full rounded-lg border px-3 text-center font-mono text-lg tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>{state?.message ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p> : null}<button disabled={pending} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white disabled:opacity-60">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}Xác minh</button><div className="flex items-center justify-between text-sm"><Link href={recovery ? "/login/verify-2fa" : "/login/recovery-code"} className="font-medium text-blue-600">{recovery ? "Dùng mã Authenticator" : "Dùng recovery code"}</Link><button formAction={cancelTwoFactorLoginAction} className="text-slate-500">Hủy</button></div></form>;
}
