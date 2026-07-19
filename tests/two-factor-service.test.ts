import { beforeEach, describe, expect, it, vi } from "vitest";
import * as OTPAuth from "otpauth";

const mocks = vi.hoisted(() => ({
  userFindUnique: vi.fn(), userUpdate: vi.fn(), statusUpdate: vi.fn(), recoveryFindFirst: vi.fn(), recoveryDeleteMany: vi.fn(), recoveryCreateMany: vi.fn(), recoveryUpdateMany: vi.fn(),
  challengeFindUnique: vi.fn(), challengeUpdate: vi.fn(), challengeUpdateMany: vi.fn(), challengeDeleteMany: vi.fn(), challengeCreate: vi.fn(), activityCreate: vi.fn(), transaction: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
  twoFactorRecoveryCode: { findFirst: mocks.recoveryFindFirst },
  twoFactorLoginChallenge: { findUnique: mocks.challengeFindUnique, update: mocks.challengeUpdate },
  activityLog: { create: mocks.activityCreate },
  $transaction: mocks.transaction,
} }));

import { encryptSecret } from "@/lib/encryption";
import { confirmTwoFactorSetup, createLoginChallenge, getLoginChallengeState, getTwoFactorStatus, verifyTwoFactorLogin } from "@/features/auth/two-factor-service";

const secret = new OTPAuth.Secret({ size: 20 }).base32;
const generator = new OTPAuth.TOTP({ issuer: "BugFlow", label: "user@example.com", secret: OTPAuth.Secret.fromBase32(secret), digits: 6, period: 30 });
const baseUser = { id: "user-1", email: "user@example.com", fullName: "Test User", avatarUrl: null, systemRole: "TESTER", accountStatus: "ACTIVE", twoFactorEnabled: true, twoFactorSecretEncrypted: "" };

describe("two-factor service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TWO_FACTOR_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    mocks.transaction.mockImplementation((callback) => callback({
      user: { update: mocks.statusUpdate }, activityLog: { create: mocks.activityCreate },
      twoFactorRecoveryCode: { deleteMany: mocks.recoveryDeleteMany, createMany: mocks.recoveryCreateMany, updateMany: mocks.recoveryUpdateMany },
      twoFactorLoginChallenge: { updateMany: mocks.challengeUpdateMany, deleteMany: mocks.challengeDeleteMany, create: mocks.challengeCreate },
    }));
    mocks.challengeUpdateMany.mockResolvedValue({ count: 1 });
    mocks.recoveryUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("does not expose the encrypted TOTP secret in status", async () => {
    mocks.userFindUnique.mockResolvedValue({ twoFactorEnabled: true, twoFactorEnabledAt: new Date(), _count: { twoFactorRecoveryCodes: 8 } });
    const status = await getTwoFactorStatus("user-1");
    expect(status).not.toHaveProperty("twoFactorSecretEncrypted");
    expect(mocks.userFindUnique).toHaveBeenCalledWith(expect.objectContaining({ select: expect.not.objectContaining({ twoFactorSecretEncrypted: true }) }));
  });

  it("creates a mandatory setup challenge for an account without 2FA", async () => {
    mocks.userFindUnique.mockResolvedValue({ twoFactorEnabled: false });
    const challenge = await createLoginChallenge("user-1");
    expect(challenge.requiresSetup).toBe(true);
    expect(mocks.statusUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ twoFactorEnabled: false, twoFactorSecretEncrypted: expect.any(String) }) }));
    expect(mocks.challengeCreate).toHaveBeenCalled();
  });

  it("does not enable 2FA when the confirmation TOTP is wrong", async () => {
    mocks.userFindUnique.mockResolvedValue({ email: "user@example.com", twoFactorEnabled: false, twoFactorSecretEncrypted: encryptSecret(secret) });
    await expect(confirmTwoFactorSetup("user-1", "abcdef")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("enables 2FA and stores only hashed recovery codes after a valid TOTP", async () => {
    mocks.userFindUnique.mockResolvedValue({ email: "user@example.com", twoFactorEnabled: false, twoFactorSecretEncrypted: encryptSecret(secret) });
    const result = await confirmTwoFactorSetup("user-1", generator.generate());
    expect(result.recoveryCodes).toHaveLength(10);
    const stored = mocks.recoveryCreateMany.mock.calls[0][0].data;
    expect(stored).toHaveLength(10);
    expect(stored[0].codeHash).not.toBe(result.recoveryCodes[0]);
    expect(stored[0]).not.toHaveProperty("code");
    expect(mocks.statusUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ twoFactorEnabled: true }) }));
  });

  it("rejects an expired challenge before checking a code", async () => {
    mocks.challengeFindUnique.mockResolvedValue({ id: "challenge-1", userId: "user-1", expiresAt: new Date(Date.now() - 1), usedAt: null, failedAttempts: 0, user: { ...baseUser, twoFactorSecretEncrypted: encryptSecret(secret) } });
    expect(await verifyTwoFactorLogin("x".repeat(40), generator.generate(), "totp")).toBeNull();
    expect(mocks.challengeUpdate).not.toHaveBeenCalled();
  });

  it("reports challenge expiry separately from an invalid TOTP", async () => {
    mocks.challengeFindUnique.mockResolvedValue({ expiresAt: new Date(Date.now() - 1), usedAt: null, failedAttempts: 0 });
    await expect(getLoginChallengeState("x".repeat(40))).resolves.toBe("EXPIRED");
  });

  it("rejects an already used challenge", async () => {
    mocks.challengeFindUnique.mockResolvedValue({ id: "challenge-1", userId: "user-1", expiresAt: new Date(Date.now() + 60_000), usedAt: new Date(), failedAttempts: 0, user: { ...baseUser, twoFactorSecretEncrypted: encryptSecret(secret) } });
    expect(await verifyTwoFactorLogin("x".repeat(40), generator.generate(), "totp")).toBeNull();
  });

  it("increments attempts and audits an invalid TOTP", async () => {
    mocks.challengeFindUnique.mockResolvedValue({ id: "challenge-1", userId: "user-1", expiresAt: new Date(Date.now() + 60_000), usedAt: null, failedAttempts: 0, user: { ...baseUser, twoFactorSecretEncrypted: encryptSecret(secret) } });
    expect(await verifyTwoFactorLogin("x".repeat(40), "abcdef", "totp")).toBeNull();
    expect(mocks.challengeUpdate).toHaveBeenCalledWith({ where: { id: "challenge-1" }, data: { failedAttempts: { increment: 1 } } });
    expect(mocks.activityCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actionType: "TWO_FACTOR_VERIFICATION_FAILED" }) }));
  });

  it("consumes a valid challenge exactly once before returning an auth user", async () => {
    mocks.challengeFindUnique.mockResolvedValue({ id: "challenge-1", userId: "user-1", expiresAt: new Date(Date.now() + 60_000), usedAt: null, failedAttempts: 0, user: { ...baseUser, twoFactorSecretEncrypted: encryptSecret(secret) } });
    const user = await verifyTwoFactorLogin("x".repeat(40), generator.generate(), "totp");
    expect(mocks.challengeUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ usedAt: null }), data: { usedAt: expect.any(Date) } }));
    expect(user).toEqual({ id: "user-1", email: "user@example.com", name: "Test User", image: null, systemRole: "TESTER" });
    expect(user).not.toHaveProperty("twoFactorSecretEncrypted");
  });

  it("enrolls an account during mandatory first-login verification", async () => {
    mocks.challengeFindUnique.mockResolvedValue({ id: "challenge-1", userId: "user-1", expiresAt: new Date(Date.now() + 60_000), usedAt: null, failedAttempts: 0, user: { ...baseUser, twoFactorEnabled: false, twoFactorSecretEncrypted: encryptSecret(secret) } });
    const user = await verifyTwoFactorLogin("x".repeat(40), generator.generate(), "totp");
    expect(user?.id).toBe("user-1");
    expect(mocks.recoveryCreateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ codeHash: expect.any(String) })]) }));
    expect(mocks.statusUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ twoFactorEnabled: true, twoFactorEnabledAt: expect.any(Date) }) }));
  });

  it("marks a recovery code used in the same successful login transaction", async () => {
    mocks.challengeFindUnique.mockResolvedValue({ id: "challenge-1", userId: "user-1", expiresAt: new Date(Date.now() + 60_000), usedAt: null, failedAttempts: 0, user: { ...baseUser, twoFactorSecretEncrypted: encryptSecret(secret) } });
    mocks.recoveryFindFirst.mockResolvedValue({ id: "recovery-1" });
    await verifyTwoFactorLogin("x".repeat(40), "AAAA-BBBB-CCCC-DDDD-EEEE-FFFF-1111-2222", "recovery");
    expect(mocks.recoveryUpdateMany).toHaveBeenCalledWith({ where: { id: "recovery-1", usedAt: null }, data: { usedAt: expect.any(Date) } });
    expect(mocks.activityCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ actionType: "TWO_FACTOR_RECOVERY_CODE_USED" }) }));
  });
});
