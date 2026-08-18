ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CHAT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'URGENT_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SYSTEM_NOTIFICATION';

CREATE TYPE "NotificationMuteTargetType" AS ENUM ('PROJECT', 'CONVERSATION');

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationPreference_userId_type_key" ON "NotificationPreference"("userId", "type");
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "NotificationMute" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "targetType" "NotificationMuteTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationMute_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationMute_userId_targetType_targetId_key" ON "NotificationMute"("userId", "targetType", "targetId");
CREATE INDEX "NotificationMute_userId_targetType_idx" ON "NotificationMute"("userId", "targetType");
ALTER TABLE "NotificationMute" ADD CONSTRAINT "NotificationMute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMessage" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
CREATE INDEX "ChatMessage_reminderAt_reminderSentAt_idx" ON "ChatMessage"("reminderAt", "reminderSentAt");
