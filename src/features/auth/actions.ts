"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { signOut } from "@/auth";
import { registerUser, verifyPasswordLogin } from "@/features/auth/service";
import { createLoginChallenge } from "@/features/auth/two-factor-service";
import { AppError } from "@/lib/errors";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

export type AuthActionState = {
  success: boolean;
  status: "ERROR" | "REQUIRE_2FA";
  message: string;
  redirectTo?: "/login/setup-2fa" | "/login/verify-2fa";
  fieldErrors?: Record<string, string[]>;
} | undefined;

function logLoginTwoFactorFailure(step: "password" | "challenge", userId: string | undefined, error: unknown) {
  console.error("[login-2fa] failed", {
    step,
    userId,
    error: error instanceof Error ? error.message : String(error),
  });
}

export async function loginAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, status: "ERROR", message: "Vui lòng kiểm tra các trường được đánh dấu", fieldErrors: parsed.error.flatten().fieldErrors };

  try { consumeRateLimit("login", rateLimitKey(parsed.data.email), 10, 15 * 60_000); }
  catch (error) { return { success: false, status: "ERROR", message: error instanceof AppError ? error.message : "Bạn đã thử quá nhiều lần" }; }

  let passwordLogin: Awaited<ReturnType<typeof verifyPasswordLogin>>;
  try {
    passwordLogin = await verifyPasswordLogin(parsed.data.email, parsed.data.password);
  } catch (error) {
    logLoginTwoFactorFailure("password", undefined, error);
    return { success: false, status: "ERROR", message: "Không thể kết nối dịch vụ đăng nhập. Vui lòng thử lại sau." };
  }
  if (!passwordLogin) return { success: false, status: "ERROR", message: "Email hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa" };

  try {
    const challenge = await createLoginChallenge(passwordLogin.id);
    (await cookies()).set("bugflow_2fa_challenge", challenge.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: challenge.expiresAt, priority: "high" });
    return {
      success: true,
      status: "REQUIRE_2FA",
      message: "Vui lòng xác thực 2FA",
      redirectTo: challenge.requiresSetup ? "/login/setup-2fa" : "/login/verify-2fa",
    };
  } catch (error) {
    logLoginTwoFactorFailure("challenge", passwordLogin.id, error);
    return { success: false, status: "ERROR", message: "Không thể khởi tạo xác thực 2FA. Vui lòng thử lại hoặc liên hệ quản trị viên." };
  }
}

export async function registerAction(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, status: "ERROR", message: "Vui lòng kiểm tra các trường được đánh dấu", fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof AppError) return { success: false, status: "ERROR", message: error.message };
    return { success: false, status: "ERROR", message: "Không thể tạo tài khoản" };
  }

  redirect("/login?registered=1");
}

export async function logoutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}
