"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { signOut } from "@/auth";
import { registerUser, verifyPasswordLogin } from "@/features/auth/service";
import { createLoginChallenge } from "@/features/auth/two-factor-service";
import { AppError } from "@/lib/errors";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

export type AuthActionState = { success: false; message: string; fieldErrors?: Record<string, string[]> } | undefined;

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Vui lòng kiểm tra các trường được đánh dấu", fieldErrors: parsed.error.flatten().fieldErrors };

  try { consumeRateLimit("login", rateLimitKey(parsed.data.email), 10, 15 * 60_000); }
  catch (error) { return { success: false, message: error instanceof AppError ? error.message : "Bạn đã thử quá nhiều lần" }; }
  const passwordLogin = await verifyPasswordLogin(parsed.data.email, parsed.data.password);
  if (!passwordLogin) return { success: false, message: "Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa" };
  const challenge = await createLoginChallenge(passwordLogin.id);
  (await cookies()).set("bugflow_2fa_challenge", challenge.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: challenge.expiresAt, priority: "high" });
  redirect(challenge.requiresSetup ? "/login/setup-2fa" : "/login/verify-2fa");
}

export async function registerAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, message: "Check the highlighted fields", fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { success: false, message: error.message };
    return { success: false, message: "Unable to create your account" };
  }

  redirect("/login?registered=1");
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}
