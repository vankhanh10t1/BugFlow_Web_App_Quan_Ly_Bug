ALTER TYPE "ActivityType" ADD VALUE 'DOCUMENT_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'DOCUMENT_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE 'DOCUMENT_DELETED';
ALTER TYPE "ActivityType" ADD VALUE 'DOCUMENT_REVISION_RESTORED';

CREATE TABLE "ProjectDocument" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL, "content" TEXT NOT NULL, "type" TEXT,
  "createdById" TEXT NOT NULL, "updatedById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3), CONSTRAINT "ProjectDocument_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "DocumentRevision" (
  "id" TEXT NOT NULL, "documentId" TEXT NOT NULL, "title" TEXT NOT NULL, "content" TEXT NOT NULL,
  "version" INTEGER NOT NULL, "createdById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProjectDocument_projectId_slug_key" ON "ProjectDocument"("projectId", "slug");
CREATE INDEX "ProjectDocument_projectId_deletedAt_updatedAt_idx" ON "ProjectDocument"("projectId", "deletedAt", "updatedAt");
CREATE INDEX "ProjectDocument_createdById_idx" ON "ProjectDocument"("createdById");
CREATE UNIQUE INDEX "DocumentRevision_documentId_version_key" ON "DocumentRevision"("documentId", "version");
CREATE INDEX "DocumentRevision_documentId_createdAt_idx" ON "DocumentRevision"("documentId", "createdAt");
CREATE INDEX "DocumentRevision_createdById_idx" ON "DocumentRevision"("createdById");
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectDocument" ADD CONSTRAINT "ProjectDocument_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentRevision" ADD CONSTRAINT "DocumentRevision_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ProjectDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentRevision" ADD CONSTRAINT "DocumentRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
