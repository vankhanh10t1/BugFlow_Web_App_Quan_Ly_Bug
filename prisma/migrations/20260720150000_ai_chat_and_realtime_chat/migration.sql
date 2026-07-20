-- AI MVP intentionally stores no transcript. This migration adds persistent chat only.
CREATE TYPE "ChatConversationType" AS ENUM ('PROJECT', 'DIRECT', 'SUPPORT');
ALTER TYPE "NotificationType" ADD VALUE 'CHAT_MESSAGE';

CREATE TABLE "ChatConversation" (
  "id" TEXT NOT NULL,
  "type" "ChatConversationType" NOT NULL,
  "title" TEXT,
  "projectId" TEXT,
  "directKey" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatParticipant" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  "lastReadAt" TIMESTAMP(3),
  CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "clientId" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "editedAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Notification" ADD COLUMN "conversationId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "chatMessageId" TEXT;

CREATE UNIQUE INDEX "ChatConversation_projectId_key" ON "ChatConversation"("projectId");
CREATE UNIQUE INDEX "ChatConversation_directKey_key" ON "ChatConversation"("directKey");
CREATE INDEX "ChatConversation_type_updatedAt_idx" ON "ChatConversation"("type", "updatedAt");
CREATE INDEX "ChatConversation_createdById_idx" ON "ChatConversation"("createdById");
CREATE UNIQUE INDEX "ChatParticipant_conversationId_userId_key" ON "ChatParticipant"("conversationId", "userId");
CREATE INDEX "ChatParticipant_userId_leftAt_idx" ON "ChatParticipant"("userId", "leftAt");
CREATE UNIQUE INDEX "ChatMessage_conversationId_clientId_key" ON "ChatMessage"("conversationId", "clientId");
CREATE INDEX "ChatMessage_conversationId_createdAt_id_idx" ON "ChatMessage"("conversationId", "createdAt", "id");
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");
CREATE INDEX "Notification_conversationId_idx" ON "Notification"("conversationId");
CREATE INDEX "Notification_chatMessageId_idx" ON "Notification"("chatMessageId");

ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
