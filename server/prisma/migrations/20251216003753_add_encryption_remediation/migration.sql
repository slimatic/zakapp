-- CreateTable
CREATE TABLE "encryption_remediations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "note" TEXT,
    "sampleData" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "encryption_remediations_targetType_idx" ON "encryption_remediations"("targetType");

-- CreateIndex
CREATE INDEX "encryption_remediations_targetId_idx" ON "encryption_remediations"("targetId");

-- CreateIndex
CREATE INDEX "encryption_remediations_status_idx" ON "encryption_remediations"("status");
