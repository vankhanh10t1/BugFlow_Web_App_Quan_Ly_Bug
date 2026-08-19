CREATE TABLE "AIAuditLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "task" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "latencyMs" INTEGER,
  "tokenEstimate" INTEGER,
  "status" TEXT NOT NULL,
  "targetType" TEXT,
  "targetId" TEXT,
  "feedback" TEXT,
  "applyStatus" TEXT DEFAULT 'not_applied',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AIAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AIAuditLog_userId_idx" ON "AIAuditLog"("userId");
CREATE INDEX "AIAuditLog_task_idx" ON "AIAuditLog"("task");
CREATE INDEX "AIAuditLog_targetType_targetId_idx" ON "AIAuditLog"("targetType", "targetId");
ALTER TABLE "AIAuditLog" ADD CONSTRAINT "AIAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAuditLog" ADD CONSTRAINT "AIAuditLog_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Bug"("id") ON DELETE SET NULL ON UPDATE CASCADE;
