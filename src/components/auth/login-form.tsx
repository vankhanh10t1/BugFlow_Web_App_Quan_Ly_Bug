"use client";
import { useActionState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import { loginAction } from "@/features/auth/actions";
import { AuthField } from "@/components/auth/auth-field";
export function LoginForm() { const [state, action, pending] = useActionState(loginAction, undefined); return <form action={action} className="space-y-4"><AuthField id="email" name="email" type="email" label="Email" autoComplete="email" required error={state?.fieldErrors?.email} /><AuthField id="password" name="password" type="password" label="Mật khẩu" autoComplete="current-password" required error={state?.fieldErrors?.password} />{state?.message ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.message}</p> : null}<button disabled={pending} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />} Đăng nhập</button></form>; }
