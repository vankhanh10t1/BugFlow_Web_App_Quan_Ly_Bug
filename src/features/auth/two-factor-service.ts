import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { compare } from "bcryptjs";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { decryptSecret, encryptSecret } from "@/lib/encryption";

const RECOVERY_CODE_COUNT = 10;
const terminalChallengeError = "Phiên xác thực không hợp lệ hoặc đã hết hạn";
const authUserSelect = { id: true, email: true, fullName: true, avatarUrl: true, systemRole: true, accountStatus: true } as const;

function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }
function challengeTtlMinutes() { const value = Number(process.env.TWO_FACTOR_CHALLENGE_TTL_MINUTES ?? 10); return Number.isFinite(value) && value > 0 && value <= 30 ? value : 10; }
function maxAttempts() { const value = Number(process.env.TWO_FACTOR_MAX_ATTEMPTS ?? 5); return Number.isInteger(value) && value >= 3 && value <= 10 ? value : 5; }
function totpWindow() { const value = Number(process.env.TWO_FACTOR_TOTP_WINDOW ?? 2); return Number.isInteger(value) && value >= 1 && value <= 2 ? value : 2; }
function normalizeRecoveryCode(value: string) { return value.trim().toUpperCase(); }
function recoveryCodeHash(value: string) { return sha256(normalizeRecoveryCode(value)); }

function totp(secret: string, label: string) {
  return new OTPAuth.TOTP({ issuer: "BugFlow", label, algorithm: "SHA1", digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) });
}

function validTotp(secret: string, label: string, code: string) { return totp(secret, label).validate({ token: code, window: totpWindow() }) !== null; }

function generateRecoveryCodes() {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () => randomBytes(16).toString("hex").toUpperCase().match(/.{1,4}/g)!.join("-"));
}

async function audit(userId: string, actionType: "TWO_FACTOR_ENABLED" | "TWO_FACTOR_DISABLED" | "TWO_FACTOR_RECOVERY_CODES_REGENERATED" | "LOGIN_SUCCEEDED" | "TWO_FACTOR_VERIFICATION_FAILED" | "TWO_FACTOR_RECOVERY_CODE_USED", description: string) {
  await prisma.activityLog.create({ data: { projectId: null, actorId: userId, actionType, description } });
}

export async function getTwoFactorStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { twoFactorEnabled: true, twoFactorEnabledAt: true, _count: { select: { twoFactorRecoveryCodes: { where: { usedAt: null } } } } } });
  if (!user) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy người dùng", 404);
  return { enabled: user.twoFactorEnabled, enabledAt: user.twoFactorEnabledAt, remainingRecoveryCodes: user._count.twoFactorRecoveryCodes };
}

export async function beginTwoFactorSetup(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, passwordHash: true, twoFactorEnabled: true } });
  if (!user) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy người dùng", 404);
  if (user.twoFactorEnabled) throw new AppError("VALIDATION_ERROR", "Two-factor authentication đã được bật", 400);
  if (!(await compare(password, user.passwordHash))) throw new AppError("VALIDATION_ERROR", "Mật khẩu hiện tại không đúng", 400);
  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const uri = totp(secret, user.email).toString();
  await prisma.user.update({ where: { id: userId }, data: { twoFactorSecretEncrypted: encryptSecret(secret), twoFactorEnabled: false, twoFactorEnabledAt: null } });
  return { qrCodeDataUrl: await QRCode.toDataURL(uri, { width: 280, margin: 1, errorCorrectionLevel: "M" }) };
}

export async function confirmTwoFactorSetup(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, twoFactorEnabled: true, twoFactorSecretEncrypted: true } });
  if (!user?.twoFactorSecretEncrypted) throw new AppError("VALIDATION_ERROR", "Hãy bắt đầu thiết lập 2FA trước", 400);
  if (user.twoFactorEnabled) throw new AppError("VALIDATION_ERROR", "Two-factor authentication đã được bật", 400);
  if (!validTotp(decryptSecret(user.twoFactorSecretEncrypted), user.email, code)) throw new AppError("VALIDATION_ERROR", "Mã xác thực không đúng", 400);
  const codes = generateRecoveryCodes();
  await prisma.$transaction(async (tx) => {
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
    await tx.twoFactorRecoveryCode.createMany({ data: codes.map((value) => ({ userId, codeHash: recoveryCodeHash(value) })) });
    await tx.user.update({ where: { id: userId }, data: { twoFactorEnabled: true, twoFactorEnabledAt: new Date() } });
    await tx.activityLog.create({ data: { projectId: null, actorId: userId, actionType: "TWO_FACTOR_ENABLED", description: "Enabled two-factor authentication" } });
  });
  return { recoveryCodes: codes };
}

export async function createLoginChallenge(userId: string) {
  const rawToken = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + challengeTtlMinutes() * 60_000);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { twoFactorEnabled: true } });
  if (!user) throw new AppError("RESOURCE_NOT_FOUND", "Không tìm thấy người dùng", 404);
  const requiresSetup = !user.twoFactorEnabled;
  const setupSecret = requiresSetup ? new OTPAuth.Secret({ size: 20 }).base32 : null;
  await prisma.$transaction(async (tx) => {
    await tx.twoFactorLoginChallenge.deleteMany({ where: { OR: [{ expiresAt: { lte: now } }, { usedAt: { not: null } }, { failedAttempts: { gte: maxAttempts() } }] } });
    if (setupSecret) await tx.user.update({ where: { id: userId }, data: { twoFactorSecretEncrypted: encryptSecret(setupSecret), twoFactorEnabled: false, twoFactorEnabledAt: null } });
    await tx.twoFactorLoginChallenge.create({ data: { userId, tokenHash: sha256(rawToken), expiresAt } });
  });
  return { token: rawToken, expiresAt, requiresSetup };
}

export async function getPendingLoginSetup(challengeToken: string) {
  const now = new Date();
  const challenge = await prisma.twoFactorLoginChallenge.findUnique({ where: { tokenHash: sha256(challengeToken) }, select: { expiresAt: true, usedAt: true, failedAttempts: true, user: { select: { email: true, accountStatus: true, twoFactorEnabled: true, twoFactorSecretEncrypted: true } } } });
  if (!challenge || challenge.usedAt || challenge.expiresAt <= now || challenge.failedAttempts >= maxAttempts() || challenge.user.accountStatus !== "ACTIVE" || challenge.user.twoFactorEnabled || !challenge.user.twoFactorSecretEncrypted) return null;
  const uri = totp(decryptSecret(challenge.user.twoFactorSecretEncrypted), challenge.user.email).toString();
  return { qrCodeDataUrl: await QRCode.toDataURL(uri, { width: 280, margin: 1, errorCorrectionLevel: "M" }) };
}

export async function getLoginChallengeState(challengeToken: string): Promise<"ACTIVE" | "EXPIRED" | "LOCKED" | "USED" | "INVALID"> {
  const challenge = await prisma.twoFactorLoginChallenge.findUnique({
    where: { tokenHash: sha256(challengeToken) },
    select: { expiresAt: true, usedAt: true, failedAttempts: true },
  });
  if (!challenge) return "INVALID";
  if (challenge.usedAt) return "USED";
  if (challenge.expiresAt <= new Date()) return "EXPIRED";
  if (challenge.failedAttempts >= maxAttempts()) return "LOCKED";
  return "ACTIVE";
}

export async function verifyTwoFactorLogin(challengeToken: string, verification: string, method: "totp" | "recovery") {
  const now = new Date();
  const challenge = await prisma.twoFactorLoginChallenge.findUnique({ where: { tokenHash: sha256(challengeToken) }, select: { id: true, userId: true, expiresAt: true, usedAt: true, failedAttempts: true, user: { select: { ...authUserSelect, twoFactorEnabled: true, twoFactorSecretEncrypted: true } } } });
  if (!challenge || challenge.usedAt || challenge.expiresAt <= now || challenge.failedAttempts >= maxAttempts() || challenge.user.accountStatus !== "ACTIVE" || !challenge.user.twoFactorSecretEncrypted) return null;

  let recoveryId: string | null = null;
  let valid = false;
  if (method === "totp") valid = validTotp(decryptSecret(challenge.user.twoFactorSecretEncrypted), challenge.user.email, verification);
  else if (challenge.user.twoFactorEnabled) {
    const hash = recoveryCodeHash(verification);
    const recovery = await prisma.twoFactorRecoveryCode.findFirst({ where: { userId: challenge.userId, codeHash: hash, usedAt: null }, select: { id: true } });
    recoveryId = recovery?.id ?? null;
    valid = Boolean(recoveryId);
  }

  if (!valid) {
    await prisma.twoFactorLoginChallenge.update({ where: { id: challenge.id }, data: { failedAttempts: { increment: 1 } } });
    await audit(challenge.userId, "TWO_FACTOR_VERIFICATION_FAILED", "Two-factor login verification failed");
    console.warn("[login-2fa] rejected", { step: "verification", userId: challenge.userId, reason: method === "totp" ? "invalid_totp" : "invalid_recovery_code" });
    return null;
  }

  const consumed = await prisma.$transaction(async (tx) => {
    const result = await tx.twoFactorLoginChallenge.updateMany({ where: { id: challenge.id, usedAt: null, expiresAt: { gt: now }, failedAttempts: { lt: maxAttempts() } }, data: { usedAt: now } });
    if (result.count !== 1) throw new AppError("VALIDATION_ERROR", terminalChallengeError, 400);
    if (recoveryId) {
      const recovery = await tx.twoFactorRecoveryCode.updateMany({ where: { id: recoveryId, usedAt: null }, data: { usedAt: now } });
      if (recovery.count !== 1) throw new AppError("VALIDATION_ERROR", "Mã khôi phục đã được sử dụng", 400);
      await tx.activityLog.create({ data: { projectId: null, actorId: challenge.userId, actionType: "TWO_FACTOR_RECOVERY_CODE_USED", description: "Used a two-factor recovery code" } });
    }
    if (!challenge.user.twoFactorEnabled) {
      const codes = generateRecoveryCodes();
      await tx.twoFactorRecoveryCode.deleteMany({ where: { userId: challenge.userId } });
      await tx.twoFactorRecoveryCode.createMany({ data: codes.map((value) => ({ userId: challenge.userId, codeHash: recoveryCodeHash(value) })) });
      await tx.activityLog.create({ data: { projectId: null, actorId: challenge.userId, actionType: "TWO_FACTOR_ENABLED", description: "Enrolled in mandatory two-factor authentication during sign-in" } });
    }
    await tx.user.update({ where: { id: challenge.userId }, data: { lastLoginAt: now, ...(!challenge.user.twoFactorEnabled ? { twoFactorEnabled: true, twoFactorEnabledAt: now } : {}) } });
    await tx.activityLog.create({ data: { projectId: null, actorId: challenge.userId, actionType: "LOGIN_SUCCEEDED", description: "Signed in with two-factor authentication" } });
    return true;
  });
  if (!consumed) return null;
  return { id: challenge.user.id, email: challenge.user.email, name: challenge.user.fullName, image: challenge.user.avatarUrl, systemRole: challenge.user.systemRole };
}

async function verifyCurrentFactor(userId: string, verification: string, method: "totp" | "recovery") {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, twoFactorSecretEncrypted: true, twoFactorEnabled: true } });
  if (!user?.twoFactorEnabled || !user.twoFactorSecretEncrypted) return false;
  if (method === "totp") return validTotp(decryptSecret(user.twoFactorSecretEncrypted), user.email, verification);
  const recovery = await prisma.twoFactorRecoveryCode.findFirst({ where: { userId, codeHash: recoveryCodeHash(verification), usedAt: null }, select: { id: true } });
  return Boolean(recovery);
}

export async function disableTwoFactor(userId: string, password: string, verification: string, method: "totp" | "recovery") {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true, twoFactorEnabled: true } });
  if (!user?.twoFactorEnabled) throw new AppError("VALIDATION_ERROR", "Two-factor authentication chưa được bật", 400);
  if (!(await compare(password, user.passwordHash))) throw new AppError("VALIDATION_ERROR", "Mật khẩu hiện tại không đúng", 400);
  if (!(await verifyCurrentFactor(userId, verification, method))) throw new AppError("VALIDATION_ERROR", "Mã xác thực không đúng", 400);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecretEncrypted: null, twoFactorEnabledAt: null } });
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
    await tx.twoFactorLoginChallenge.deleteMany({ where: { userId } });
    await tx.activityLog.create({ data: { projectId: null, actorId: userId, actionType: "TWO_FACTOR_DISABLED", description: "Disabled two-factor authentication" } });
  });
}

export async function regenerateRecoveryCodes(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true, twoFactorEnabled: true } });
  if (!user?.twoFactorEnabled) throw new AppError("VALIDATION_ERROR", "Two-factor authentication chưa được bật", 400);
  if (!(await compare(password, user.passwordHash))) throw new AppError("VALIDATION_ERROR", "Mật khẩu hiện tại không đúng", 400);
  const codes = generateRecoveryCodes();
  await prisma.$transaction(async (tx) => {
    await tx.twoFactorRecoveryCode.deleteMany({ where: { userId } });
    await tx.twoFactorRecoveryCode.createMany({ data: codes.map((value) => ({ userId, codeHash: recoveryCodeHash(value) })) });
    await tx.activityLog.create({ data: { projectId: null, actorId: userId, actionType: "TWO_FACTOR_RECOVERY_CODES_REGENERATED", description: "Regenerated two-factor recovery codes" } });
  });
  return { recoveryCodes: codes };
}

export { terminalChallengeError };
