ALTER TYPE "ChatMessageType" ADD VALUE 'GIF';

ALTER TABLE "ChatMessage"
  ADD COLUMN "gifUrl" TEXT,
  ADD COLUMN "gifPreviewUrl" TEXT,
  ADD COLUMN "gifWidth" INTEGER,
  ADD COLUMN "gifHeight" INTEGER,
  ADD COLUMN "gifProvider" TEXT;
