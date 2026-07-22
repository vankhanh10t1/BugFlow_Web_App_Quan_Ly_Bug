CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'EMOJI', 'STICKER', 'IMAGE', 'FILE', 'REMINDER');
CREATE TYPE "ChatMessagePriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

ALTER TABLE "ChatParticipant"
  ADD COLUMN "lastDeliveredAt" TIMESTAMP(3),
  ADD COLUMN "hiddenAt" TIMESTAMP(3),
  ADD COLUMN "historyClearedAt" TIMESTAMP(3),
  ADD COLUMN "autoDeleteSeconds" INTEGER;

ALTER TABLE "ChatMessage"
  ADD COLUMN "type" "ChatMessageType" NOT NULL DEFAULT 'TEXT',
  ADD COLUMN "priority" "ChatMessagePriority" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "sticker" TEXT,
  ADD COLUMN "attachmentUrl" TEXT,
  ADD COLUMN "attachmentPublicId" TEXT,
  ADD COLUMN "attachmentName" TEXT,
  ADD COLUMN "attachmentMime" TEXT,
  ADD COLUMN "attachmentSize" INTEGER,
  ADD COLUMN "attachmentType" "AttachmentType",
  ADD COLUMN "reminderAt" TIMESTAMP(3),
  ADD COLUMN "pinnedAt" TIMESTAMP(3),
  ADD COLUMN "pinnedById" TEXT,
  ADD COLUMN "recalledAt" TIMESTAMP(3),
  ADD COLUMN "recalledById" TEXT;

CREATE TABLE "ChatMessageMark" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessageMark_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessageHidden" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessageHidden_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatReport" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatMessageMark_messageId_userId_key" ON "ChatMessageMark"("messageId", "userId");
CREATE INDEX "ChatMessageMark_userId_createdAt_idx" ON "ChatMessageMark"("userId", "createdAt");
CREATE UNIQUE INDEX "ChatMessageHidden_messageId_userId_key" ON "ChatMessageHidden"("messageId", "userId");
CREATE INDEX "ChatMessageHidden_userId_createdAt_idx" ON "ChatMessageHidden"("userId", "createdAt");
CREATE INDEX "ChatReport_conversationId_createdAt_idx" ON "ChatReport"("conversationId", "createdAt");
CREATE INDEX "ChatReport_reporterId_createdAt_idx" ON "ChatReport"("reporterId", "createdAt");
CREATE INDEX "ChatMessage_conversationId_pinnedAt_idx" ON "ChatMessage"("conversationId", "pinnedAt");
CREATE INDEX "ChatMessage_conversationId_type_createdAt_idx" ON "ChatMessage"("conversationId", "type", "createdAt");
CREATE INDEX "ChatMessage_reminderAt_idx" ON "ChatMessage"("reminderAt");

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatMessageMark" ADD CONSTRAINT "ChatMessageMark_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessageMark" ADD CONSTRAINT "ChatMessageMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessageHidden" ADD CONSTRAINT "ChatMessageHidden_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessageHidden" ADD CONSTRAINT "ChatMessageHidden_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatReport" ADD CONSTRAINT "ChatReport_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatReport" ADD CONSTRAINT "ChatReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
