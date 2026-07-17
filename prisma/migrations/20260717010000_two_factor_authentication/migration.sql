ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'TWO_FACTOR_ENABLED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'TWO_FACTOR_DISABLED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'TWO_FACTOR_RECOVERY_CODES_REGENERATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'TWO_FACTOR_RESET_BY_ADMIN';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'LOGIN_SUCCEEDED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'LOGIN_FAILED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'TWO_FACTOR_VERIFICATION_FAILED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'TWO_FACTOR_RECOVERY_CODE_USED';

ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "twoFactorSecretEncrypted" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorEnabledAt" TIMESTAMP(3);

ALTER TABLE "ActivityLog" ALTER COLUMN "projectId" DROP NOT NULL;

CREATE TABLE "TwoFactorRecoveryCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TwoFactorRecoveryCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TwoFactorLoginChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TwoFactorLoginChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TwoFactorRecoveryCode_userId_usedAt_idx" ON "TwoFactorRecoveryCode"("userId", "usedAt");
CREATE UNIQUE INDEX "TwoFactorLoginChallenge_tokenHash_key" ON "TwoFactorLoginChallenge"("tokenHash");
CREATE INDEX "TwoFactorLoginChallenge_userId_expiresAt_idx" ON "TwoFactorLoginChallenge"("userId", "expiresAt");
CREATE INDEX "TwoFactorLoginChallenge_expiresAt_usedAt_idx" ON "TwoFactorLoginChallenge"("expiresAt", "usedAt");

ALTER TABLE "TwoFactorRecoveryCode" ADD CONSTRAINT "TwoFactorRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TwoFactorLoginChallenge" ADD CONSTRAINT "TwoFactorLoginChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
