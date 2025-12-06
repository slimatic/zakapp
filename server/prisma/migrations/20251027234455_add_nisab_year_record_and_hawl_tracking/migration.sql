-- Step 1: Create new audit_trail_entries table (before renaming)
CREATE TABLE "audit_trail_entries" (
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
    CONSTRAINT "audit_trail_entries_nisabYearRecordId_fkey" FOREIGN KEY ("nisabYearRecordId") REFERENCES "yearly_snapshots" ("id") ON DELETE CASCADE,
    CONSTRAINT "audit_trail_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Step 2: Create new precious_metal_prices table
CREATE TABLE "precious_metal_prices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metalType" TEXT NOT NULL,
    "pricePerGram" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceApi" TEXT NOT NULL DEFAULT 'metals-api.com',
    "expiresAt" DATETIME NOT NULL
);

-- Step 3: Add new columns to yearly_snapshots table
ALTER TABLE "yearly_snapshots" ADD COLUMN "hawlStartDate" DATETIME;
ALTER TABLE "yearly_snapshots" ADD COLUMN "hawlStartDateHijri" TEXT;
ALTER TABLE "yearly_snapshots" ADD COLUMN "hawlCompletionDate" DATETIME;
ALTER TABLE "yearly_snapshots" ADD COLUMN "hawlCompletionDateHijri" TEXT;
ALTER TABLE "yearly_snapshots" ADD COLUMN "nisabThresholdAtStart" TEXT;
ALTER TABLE "yearly_snapshots" ADD COLUMN "nisabBasis" TEXT;
ALTER TABLE "yearly_snapshots" ADD COLUMN "finalizedAt" DATETIME;

-- Step 4: Update status values from lowercase to UPPERCASE
UPDATE "yearly_snapshots" SET "status" = 'DRAFT' WHERE "status" = 'draft';
UPDATE "yearly_snapshots" SET "status" = 'FINALIZED' WHERE "status" = 'finalized';

-- Step 5: Set default values for existing records
UPDATE "yearly_snapshots" 
SET 
  "hawlStartDate" = date("calculationDate", '-354 days'),
  "hawlCompletionDate" = "calculationDate",
  "nisabBasis" = "nisabType",
  "nisabThresholdAtStart" = "nisabThreshold",
  "finalizedAt" = CASE WHEN "status" = 'FINALIZED' THEN "updatedAt" ELSE NULL END
WHERE "hawlStartDate" IS NULL;

-- Step 6: Rename table from yearly_snapshots to nisab_year_records
ALTER TABLE "yearly_snapshots" RENAME TO "nisab_year_records";

-- Step 7: Update foreign key references in payment_records table
-- Note: SQLite doesn't support direct FK updates, so we update the column name semantically
-- The actual FK reference will be updated in the next migration after Prisma schema sync

-- Step 8: Create indexes for improved query performance
CREATE INDEX "idx_nyr_user_hawl_start" ON "nisab_year_records"("userId", "hawlStartDate");
CREATE INDEX "idx_nyr_user_hawl_completion" ON "nisab_year_records"("userId", "hawlCompletionDate");
CREATE INDEX "idx_nyr_user_status_calc" ON "nisab_year_records"("userId", "status", "calculationDate" DESC);
CREATE INDEX "idx_audit_record_timestamp" ON "audit_trail_entries"("nisabYearRecordId", "timestamp" DESC);
CREATE INDEX "idx_audit_user_timestamp" ON "audit_trail_entries"("userId", "timestamp" DESC);
CREATE INDEX "idx_audit_event_type" ON "audit_trail_entries"("eventType");
CREATE INDEX "idx_prices_metal_fetched" ON "precious_metal_prices"("metalType", "fetchedAt" DESC);
CREATE UNIQUE INDEX "idx_prices_metal_unique" ON "precious_metal_prices"("metalType", "fetchedAt");