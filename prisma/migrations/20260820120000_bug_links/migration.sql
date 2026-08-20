CREATE TYPE "BugLinkType" AS ENUM ('DUPLICATE', 'BLOCKED_BY', 'RELATES_TO');
ALTER TYPE "ActivityType" ADD VALUE 'BUG_LINK_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'BUG_LINK_DELETED';

CREATE TABLE "BugLink" (
  "id" TEXT NOT NULL,
  "sourceBugId" TEXT NOT NULL,
  "targetBugId" TEXT NOT NULL,
  "type" "BugLinkType" NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BugLink_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BugLink_no_self" CHECK ("sourceBugId" <> "targetBugId")
);
CREATE UNIQUE INDEX "BugLink_sourceBugId_targetBugId_type_key" ON "BugLink"("sourceBugId", "targetBugId", "type");
CREATE INDEX "BugLink_sourceBugId_idx" ON "BugLink"("sourceBugId");
CREATE INDEX "BugLink_targetBugId_idx" ON "BugLink"("targetBugId");
CREATE INDEX "BugLink_type_idx" ON "BugLink"("type");
ALTER TABLE "BugLink" ADD CONSTRAINT "BugLink_sourceBugId_fkey" FOREIGN KEY ("sourceBugId") REFERENCES "Bug"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BugLink" ADD CONSTRAINT "BugLink_targetBugId_fkey" FOREIGN KEY ("targetBugId") REFERENCES "Bug"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BugLink" ADD CONSTRAINT "BugLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
