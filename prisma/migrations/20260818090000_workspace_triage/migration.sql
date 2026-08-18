-- Workspace triage metadata and per-user saved filters. Existing bugs remain valid.
ALTER TABLE "Bug" ADD COLUMN "componentId" TEXT;
ALTER TABLE "Bug" ADD COLUMN "versionId" TEXT;

CREATE TABLE "BugLabel" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#2563eb',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BugLabel_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Component" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Component_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Version" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SavedBugView" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "projectId" TEXT,
  "name" TEXT NOT NULL,
  "filters" JSONB NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedBugView_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "_BugToBugLabel" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_BugToBugLabel_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE UNIQUE INDEX "BugLabel_projectId_name_key" ON "BugLabel"("projectId", "name");
CREATE INDEX "BugLabel_projectId_idx" ON "BugLabel"("projectId");
CREATE UNIQUE INDEX "Component_projectId_name_key" ON "Component"("projectId", "name");
CREATE INDEX "Component_projectId_idx" ON "Component"("projectId");
CREATE UNIQUE INDEX "Version_projectId_name_key" ON "Version"("projectId", "name");
CREATE INDEX "Version_projectId_idx" ON "Version"("projectId");
CREATE UNIQUE INDEX "SavedBugView_userId_name_key" ON "SavedBugView"("userId", "name");
CREATE INDEX "SavedBugView_userId_isDefault_idx" ON "SavedBugView"("userId", "isDefault");
CREATE INDEX "SavedBugView_projectId_idx" ON "SavedBugView"("projectId");
CREATE INDEX "Bug_componentId_idx" ON "Bug"("componentId");
CREATE INDEX "Bug_versionId_idx" ON "Bug"("versionId");
CREATE INDEX "_BugToBugLabel_B_index" ON "_BugToBugLabel"("B");
ALTER TABLE "Bug" ADD CONSTRAINT "Bug_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Bug" ADD CONSTRAINT "Bug_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BugLabel" ADD CONSTRAINT "BugLabel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Component" ADD CONSTRAINT "Component_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Version" ADD CONSTRAINT "Version_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedBugView" ADD CONSTRAINT "SavedBugView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedBugView" ADD CONSTRAINT "SavedBugView_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_BugToBugLabel" ADD CONSTRAINT "_BugToBugLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "Bug"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_BugToBugLabel" ADD CONSTRAINT "_BugToBugLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "BugLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
