"use server";

import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signIn } from "@/auth";
import { requireActiveUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { beginTwoFactorSetup, confirmTwoFactorSetup, disableTwoFactor, regenerateRecoveryCodes } from "@/features/auth/two-factor-service";
import { confirmTwoFactorSchema, disableTwoFactorSchema, regenerateRecoveryCodesSchema, setupTwoFactorSchema, twoFactorCredentialsSchema } from "@/lib/validators/two-factor";

export type TwoFactorActionState = { success: boolean; message: string; qrCodeDataUrl?: string; recoveryCodes?: string[]; fieldErrors?: Record<string, string[]> } | undefined;
const failure = (error: unknown, fallback: string): TwoFactorActionState => ({ success: false, message: error instanceof AppError ? error.message : fallback });

export async function verifyTwoFactorLoginAction(method: "totp" | "recovery", _: TwoFactorActionState, formData: FormData): Promise<TwoFactorActionState> {
  const cookieStore = await cookies();
  const challengeToken = cookieStore.get("bugflow_2fa_challenge")?.value;
  const input = twoFactorCredentialsSchema.safeParse({ challengeToken, verification: formData.get("verification"), method });
  if (!input.success) return { success: false, message: challengeToken ? input.error.issues[0]?.message ?? "Mã xác thực không hợp lệ" : "Phiên xác thực không hợp lệ hoặc đã hết hạn" };
  try {
    consumeRateLimit("verify-2fa", rateLimitKey(input.data.challengeToken), 10, 10 * 60_000);
    await signIn("credentials", { ...input.data, redirect: false });
    cookieStore.delete("bugflow_2fa_challenge");
  } catch (error) {
    if (error instanceof AuthError) return { success: false, message: "Mã xác thực không đúng, challenge đã hết hạn hoặc đã bị khóa" };
    return failure(error, "Không thể xác thực two-factor authentication");
  }
  redirect("/dashboard");
}

export async function cancelTwoFactorLoginAction() { const cookieStore = await cookies(); cookieStore.delete("bugflow_2fa_challenge"); redirect("/login"); }

export async function beginTwoFactorSetupAction(_: TwoFactorActionState, formData: FormData): Promise<TwoFactorActionState> {
  const user = await requireActiveUser();
  const input = setupTwoFactorSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { success: false, message: input.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  try { const result = await beginTwoFactorSetup(user.id, input.data.password); return { success: true, message: "Hãy quét QR code và nhập mã hiện tại", qrCodeDataUrl: result.qrCodeDataUrl }; }
  catch (error) { return failure(error, "Không thể bắt đầu thiết lập 2FA"); }
}

export async function confirmTwoFactorSetupAction(_: TwoFactorActionState, formData: FormData): Promise<TwoFactorActionState> {
  const user = await requireActiveUser();
  const input = confirmTwoFactorSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { success: false, message: input.error.issues[0]?.message ?? "Mã xác thực không hợp lệ" };
  try { const result = await confirmTwoFactorSetup(user.id, input.data.code); revalidatePath("/settings/security"); return { success: true, message: "Đã bật two-factor authentication", recoveryCodes: result.recoveryCodes }; }
  catch (error) { return failure(error, "Không thể xác nhận 2FA"); }
}

export async function disableTwoFactorAction(_: TwoFactorActionState, formData: FormData): Promise<TwoFactorActionState> {
  const user = await requireActiveUser();
  const input = disableTwoFactorSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { success: false, message: input.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  try { await disableTwoFactor(user.id, input.data.password, input.data.verification, input.data.method); revalidatePath("/settings/security"); return { success: true, message: "Đã tắt two-factor authentication" }; }
  catch (error) { return failure(error, "Không thể tắt 2FA"); }
}

export async function regenerateRecoveryCodesAction(_: TwoFactorActionState, formData: FormData): Promise<TwoFactorActionState> {
  const user = await requireActiveUser();
  const input = regenerateRecoveryCodesSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return { success: false, message: "Vui lòng nhập mật khẩu" };
  try { const result = await regenerateRecoveryCodes(user.id, input.data.password); revalidatePath("/settings/security"); return { success: true, message: "Đã tạo bộ recovery code mới", recoveryCodes: result.recoveryCodes }; }
  catch (error) { return failure(error, "Không thể tạo lại recovery code"); }
}
