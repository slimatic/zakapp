-- AlterTable
ALTER TABLE "liabilities" ADD COLUMN "deductibleAmount" REAL;

-- CreateTable
CREATE TABLE "asset_amount_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effectiveDate" DATETIME NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "originalEventId" TEXT,
    CONSTRAINT "asset_amount_events_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "asset_amount_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asset_amount_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_amount_snapshots_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_trail_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nisabYearRecordId" TEXT,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockReason" TEXT,
    "changesSummary" TEXT,
    "beforeState" TEXT,
    "afterState" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "assetAmountEventId" TEXT,
    CONSTRAINT "audit_trail_entries_nisabYearRecordId_fkey" FOREIGN KEY ("nisabYearRecordId") REFERENCES "nisab_year_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_trail_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_trail_entries_assetAmountEventId_fkey" FOREIGN KEY ("assetAmountEventId") REFERENCES "asset_amount_events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_trail_entries" ("afterState", "beforeState", "changesSummary", "eventType", "id", "ipAddress", "nisabYearRecordId", "timestamp", "unlockReason", "userAgent", "userId") SELECT "afterState", "beforeState", "changesSummary", "eventType", "id", "ipAddress", "nisabYearRecordId", "timestamp", "unlockReason", "userAgent", "userId" FROM "audit_trail_entries";
DROP TABLE "audit_trail_entries";
ALTER TABLE "new_audit_trail_entries" RENAME TO "audit_trail_entries";
CREATE INDEX "audit_trail_entries_nisabYearRecordId_timestamp_idx" ON "audit_trail_entries"("nisabYearRecordId", "timestamp" DESC);
CREATE INDEX "audit_trail_entries_userId_timestamp_idx" ON "audit_trail_entries"("userId", "timestamp" DESC);
CREATE INDEX "audit_trail_entries_eventType_idx" ON "audit_trail_entries"("eventType");
CREATE INDEX "audit_trail_entries_assetAmountEventId_idx" ON "audit_trail_entries"("assetAmountEventId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "asset_amount_events_assetId_effectiveDate_idx" ON "asset_amount_events"("assetId", "effectiveDate");

-- CreateIndex
CREATE INDEX "asset_amount_events_assetId_recordedAt_idx" ON "asset_amount_events"("assetId", "recordedAt");

-- CreateIndex
CREATE INDEX "asset_amount_events_userId_effectiveDate_idx" ON "asset_amount_events"("userId", "effectiveDate");

-- CreateIndex
CREATE INDEX "asset_amount_events_eventType_idx" ON "asset_amount_events"("eventType");

-- CreateIndex
CREATE INDEX "asset_amount_events_isReversed_idx" ON "asset_amount_events"("isReversed");

-- CreateIndex
CREATE INDEX "asset_amount_snapshots_assetId_idx" ON "asset_amount_snapshots"("assetId");

-- CreateIndex
CREATE INDEX "asset_amount_snapshots_date_idx" ON "asset_amount_snapshots"("date");

-- CreateIndex
CREATE UNIQUE INDEX "asset_amount_snapshots_assetId_date_key" ON "asset_amount_snapshots"("assetId", "date");
