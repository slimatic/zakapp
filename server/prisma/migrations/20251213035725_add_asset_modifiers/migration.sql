-- DropIndex
DROP INDEX "idx_nyr_user_status_calc";

-- AlterTable
ALTER TABLE "snapshot_asset_values" ADD COLUMN "calculationModifier" REAL;
ALTER TABLE "snapshot_asset_values" ADD COLUMN "isPassiveInvestment" BOOLEAN;
ALTER TABLE "snapshot_asset_values" ADD COLUMN "isRestrictedAccount" BOOLEAN;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "acquisitionDate" DATETIME NOT NULL,
    "metadata" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "calculationModifier" REAL NOT NULL DEFAULT 1.0,
    "isPassiveInvestment" BOOLEAN NOT NULL DEFAULT false,
    "isRestrictedAccount" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_assets" ("acquisitionDate", "category", "createdAt", "currency", "id", "isActive", "metadata", "name", "notes", "updatedAt", "userId", "value") SELECT "acquisitionDate", "category", "createdAt", "currency", "id", "isActive", "metadata", "name", "notes", "updatedAt", "userId", "value" FROM "assets";
DROP TABLE "assets";
ALTER TABLE "new_assets" RENAME TO "assets";
CREATE INDEX "assets_userId_idx" ON "assets"("userId");
CREATE INDEX "assets_category_idx" ON "assets"("category");
CREATE INDEX "assets_userId_category_idx" ON "assets"("userId", "category");
CREATE INDEX "assets_userId_isActive_idx" ON "assets"("userId", "isActive");
CREATE INDEX "assets_acquisitionDate_idx" ON "assets"("acquisitionDate");
CREATE INDEX "assets_userId_isPassiveInvestment_idx" ON "assets"("userId", "isPassiveInvestment");
CREATE INDEX "assets_userId_isRestrictedAccount_idx" ON "assets"("userId", "isRestrictedAccount");
CREATE TABLE "new_audit_trail_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nisabYearRecordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockReason" TEXT,
    "changesSummary" TEXT,
    "beforeState" TEXT,
    "afterState" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "audit_trail_entries_nisabYearRecordId_fkey" FOREIGN KEY ("nisabYearRecordId") REFERENCES "nisab_year_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_trail_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_audit_trail_entries" ("afterState", "beforeState", "changesSummary", "eventType", "id", "ipAddress", "nisabYearRecordId", "timestamp", "unlockReason", "userAgent", "userId") SELECT "afterState", "beforeState", "changesSummary", "eventType", "id", "ipAddress", "nisabYearRecordId", "timestamp", "unlockReason", "userAgent", "userId" FROM "audit_trail_entries";
DROP TABLE "audit_trail_entries";
ALTER TABLE "new_audit_trail_entries" RENAME TO "audit_trail_entries";
CREATE INDEX "audit_trail_entries_nisabYearRecordId_timestamp_idx" ON "audit_trail_entries"("nisabYearRecordId", "timestamp" DESC);
CREATE INDEX "audit_trail_entries_userId_timestamp_idx" ON "audit_trail_entries"("userId", "timestamp" DESC);
CREATE INDEX "audit_trail_entries_eventType_idx" ON "audit_trail_entries"("eventType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineIndex
DROP INDEX "idx_nyr_user_hawl_completion";
CREATE INDEX "nisab_year_records_userId_hawlCompletionDate_idx" ON "nisab_year_records"("userId", "hawlCompletionDate");

-- RedefineIndex
DROP INDEX "idx_nyr_user_hawl_start";
CREATE INDEX "nisab_year_records_userId_hawlStartDate_idx" ON "nisab_year_records"("userId", "hawlStartDate");

-- RedefineIndex
DROP INDEX "yearly_snapshots_userId_status_gregorianYear_idx";
CREATE INDEX "nisab_year_records_userId_status_gregorianYear_idx" ON "nisab_year_records"("userId", "status", "gregorianYear");

-- RedefineIndex
DROP INDEX "yearly_snapshots_userId_gregorianYear_gregorianMonth_idx";
CREATE INDEX "nisab_year_records_userId_gregorianYear_gregorianMonth_idx" ON "nisab_year_records"("userId", "gregorianYear", "gregorianMonth");

-- RedefineIndex
DROP INDEX "yearly_snapshots_userId_createdAt_idx";
CREATE INDEX "nisab_year_records_userId_createdAt_idx" ON "nisab_year_records"("userId", "createdAt" DESC);

-- RedefineIndex
DROP INDEX "yearly_snapshots_userId_isPrimary_idx";
CREATE INDEX "nisab_year_records_userId_isPrimary_idx" ON "nisab_year_records"("userId", "isPrimary");

-- RedefineIndex
DROP INDEX "yearly_snapshots_userId_status_idx";
CREATE INDEX "nisab_year_records_userId_status_idx" ON "nisab_year_records"("userId", "status");

-- RedefineIndex
DROP INDEX "yearly_snapshots_userId_hijriYear_idx";
CREATE INDEX "nisab_year_records_userId_hijriYear_idx" ON "nisab_year_records"("userId", "hijriYear");

-- RedefineIndex
DROP INDEX "yearly_snapshots_userId_gregorianYear_idx";
CREATE INDEX "nisab_year_records_userId_gregorianYear_idx" ON "nisab_year_records"("userId", "gregorianYear");

-- RedefineIndex
DROP INDEX "yearly_snapshots_userId_calculationDate_idx";
CREATE INDEX "nisab_year_records_userId_calculationDate_idx" ON "nisab_year_records"("userId", "calculationDate" DESC);

-- RedefineIndex
DROP INDEX "idx_prices_metal_unique";
CREATE UNIQUE INDEX "precious_metal_prices_metalType_fetchedAt_key" ON "precious_metal_prices"("metalType", "fetchedAt");

-- RedefineIndex
DROP INDEX "idx_prices_metal_fetched";
CREATE INDEX "precious_metal_prices_metalType_fetchedAt_idx" ON "precious_metal_prices"("metalType", "fetchedAt" DESC);
