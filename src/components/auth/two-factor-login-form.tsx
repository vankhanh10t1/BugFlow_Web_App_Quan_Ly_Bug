"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { cancelTwoFactorLoginAction, verifyTwoFactorLoginAction } from "@/features/auth/two-factor-actions";

export function TwoFactorLoginForm({ method }: { method: "totp" | "recovery" }) {
  const [state, action, pending] = useActionState(verifyTwoFactorLoginAction.bind(null, method), undefined);
  const [verification, setVerification] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const lastSubmittedCodeRef = useRef<string | null>(null);
  const recovery = method === "recovery";

  useEffect(() => {
    if (!state || state.success) return;
    submittingRef.current = false;
    lastSubmittedCodeRef.current = null;
    const timer = window.setTimeout(() => { if (!recovery) setVerification(""); inputRef.current?.focus(); }, 0);
    return () => window.clearTimeout(timer);
  }, [recovery, state]);

  useEffect(() => {
    if (recovery || pending || verification.length !== 6 || submittingRef.current || lastSubmittedCodeRef.current === verification) return;
    const timer = window.setTimeout(() => formRef.current?.requestSubmit(), 180);
    return () => window.clearTimeout(timer);
  }, [pending, recovery, verification]);

  return <form ref={formRef} action={action} onSubmit={(event) => { const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null; if (submitter?.dataset.cancel === "true") return; if (pending || submittingRef.current || (!recovery && !/^\d{6}$/.test(verification)) || lastSubmittedCodeRef.current === verification) { event.preventDefault(); return; } submittingRef.current = true; lastSubmittedCodeRef.current = verification; }} className="space-y-4"><label htmlFor="verification" className="block text-sm font-medium text-slate-700">{recovery ? "Recovery code" : "Mã xác thực 6 chữ số"}<input ref={inputRef} id="verification" name="verification" value={verification} onChange={(event) => setVerification(recovery ? event.target.value : event.target.value.replace(/\D/g, "").slice(0, 6))} autoFocus required disabled={pending} inputMode={recovery ? "text" : "numeric"} autoComplete="one-time-code" pattern={recovery ? "[A-Fa-f0-9-]+" : "[0-9]{6}"} maxLength={recovery ? 39 : 6} placeholder={recovery ? "XXXX-XXXX-…" : "000000"} aria-describedby={!recovery ? "totp-auto-submit-hint" : undefined} className="mt-1.5 h-12 w-full rounded-lg border px-3 text-center font-mono text-lg tracking-widest outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500" /></label>{!recovery ? <p id="totp-auto-submit-hint" className="text-xs text-slate-500">Mã sẽ được tự động xác minh khi bạn nhập đủ 6 số.</p> : null}{state?.message ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p> : null}<button disabled={pending || (!recovery && verification.length !== 6)} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white disabled:opacity-60">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}{pending ? "Đang xác minh…" : "Xác minh"}</button><div className="flex items-center justify-between text-sm"><Link href={recovery ? "/login/verify-2fa" : "/login/recovery-code"} className="font-medium text-blue-600">{recovery ? "Dùng mã Authenticator" : "Dùng recovery code"}</Link><button data-cancel="true" formNoValidate formAction={cancelTwoFactorLoginAction} disabled={pending} className="text-slate-500 disabled:opacity-60">Hủy</button></div></form>;
}
