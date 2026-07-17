-- Extend notification types without changing existing values.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROJECT_MEMBER_ADDED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BUG_DEADLINE_SOON';

-- Add project targets and an idempotency key for scheduled notifications.
ALTER TABLE "Notification" ADD COLUMN "projectId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;

CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_projectId_idx" ON "Notification"("projectId");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
