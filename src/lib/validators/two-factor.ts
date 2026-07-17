import { z } from "zod";

export const totpCodeSchema = z.string().trim().regex(/^\d{6}$/, "Mã xác thực phải gồm đúng 6 chữ số");
export const recoveryCodeSchema = z.string().trim().toUpperCase().regex(/^[A-F0-9]{4}(?:-[A-F0-9]{4}){7}$/, "Recovery code không hợp lệ");
export const setupTwoFactorSchema = z.object({ password: z.string().min(1, "Vui lòng nhập mật khẩu") });
export const confirmTwoFactorSchema = z.object({ code: totpCodeSchema });
export const disableTwoFactorSchema = z.discriminatedUnion("method", [
  z.object({ password: z.string().min(1), verification: totpCodeSchema, method: z.literal("totp") }),
  z.object({ password: z.string().min(1), verification: recoveryCodeSchema, method: z.literal("recovery") }),
]);
export const regenerateRecoveryCodesSchema = z.object({ password: z.string().min(1) });
export const twoFactorCredentialsSchema = z.discriminatedUnion("method", [
  z.object({ challengeToken: z.string().min(32), verification: totpCodeSchema, method: z.literal("totp") }),
  z.object({ challengeToken: z.string().min(32), verification: recoveryCodeSchema, method: z.literal("recovery") }),
]);
