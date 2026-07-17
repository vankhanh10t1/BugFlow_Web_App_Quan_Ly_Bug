"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogIn } from "lucide-react";
import { loginAction } from "@/features/auth/actions";
import { AuthField } from "@/components/auth/auth-field";
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const router = useRouter();
  useEffect(() => {
    if (state?.status === "REQUIRE_2FA" && state.redirectTo) router.push(state.redirectTo);
  }, [router, state]);
  const progressing = state?.status === "REQUIRE_2FA";
  return <form action={action} className="space-y-4"><AuthField id="email" name="email" type="email" label="Email" autoComplete="email" required error={state?.fieldErrors?.email} /><AuthField id="password" name="password" type="password" label="Mật khẩu" autoComplete="current-password" required error={state?.fieldErrors?.password} />{state?.message ? <p role={state.success ? "status" : "alert"} className={`rounded-lg p-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{state.message}</p> : null}<button disabled={pending || progressing} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{pending || progressing ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />} {progressing ? "Đang mở xác thực 2FA…" : "Đăng nhập"}</button></form>;
}
