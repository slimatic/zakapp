/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `zakatYearEnd` to the `calculation_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zakatYearStart` to the `calculation_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "asset_snapshots" ADD COLUMN "description" TEXT;
ALTER TABLE "asset_snapshots" ADD COLUMN "islamicYear" TEXT;
ALTER TABLE "asset_snapshots" ADD COLUMN "liabilitiesCount" INTEGER;
ALTER TABLE "asset_snapshots" ADD COLUMN "metadata" TEXT;
ALTER TABLE "asset_snapshots" ADD COLUMN "name" TEXT;
ALTER TABLE "asset_snapshots" ADD COLUMN "netWorth" REAL;
ALTER TABLE "asset_snapshots" ADD COLUMN "tags" TEXT;
ALTER TABLE "asset_snapshots" ADD COLUMN "totalAssets" REAL;
ALTER TABLE "asset_snapshots" ADD COLUMN "totalLiabilities" REAL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- CreateTable
CREATE TABLE "snapshot_asset_values" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "assetName" TEXT NOT NULL,
    "assetCategory" TEXT NOT NULL,
    "capturedValue" TEXT NOT NULL,
    "capturedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isZakatable" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "snapshot_asset_values_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "calculation_history" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "methodology_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nisabBasis" TEXT NOT NULL,
    "customNisabValue" REAL,
    "rate" REAL NOT NULL,
    "assetRules" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "methodology_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_security" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lastFailedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_security_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_calculation_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "methodologyConfigId" TEXT,
    "calendarType" TEXT NOT NULL,
    "calculationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "zakatYearStart" DATETIME NOT NULL,
    "zakatYearEnd" DATETIME NOT NULL,
    "totalWealth" TEXT NOT NULL,
    "nisabThreshold" TEXT NOT NULL,
    "zakatDue" TEXT NOT NULL,
    "zakatRate" REAL NOT NULL DEFAULT 2.5,
    "assetBreakdown" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "lockedAt" DATETIME,
    "unlockedAt" DATETIME,
    "unlockedBy" TEXT,
    "unlockReason" TEXT,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "calculation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "calculation_history_methodologyConfigId_fkey" FOREIGN KEY ("methodologyConfigId") REFERENCES "methodology_configs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_calculation_history" ("assetBreakdown", "calculationDate", "calendarType", "createdAt", "id", "metadata", "methodology", "nisabThreshold", "notes", "totalWealth", "updatedAt", "userId", "zakatDue", "zakatRate") SELECT "assetBreakdown", "calculationDate", "calendarType", "createdAt", "id", "metadata", "methodology", "nisabThreshold", "notes", "totalWealth", "updatedAt", "userId", "zakatDue", "zakatRate" FROM "calculation_history";
DROP TABLE "calculation_history";
ALTER TABLE "new_calculation_history" RENAME TO "calculation_history";
CREATE INDEX "calculation_history_userId_calculationDate_idx" ON "calculation_history"("userId", "calculationDate");
CREATE INDEX "calculation_history_userId_methodology_idx" ON "calculation_history"("userId", "methodology");
CREATE INDEX "calculation_history_calculationDate_idx" ON "calculation_history"("calculationDate");
CREATE INDEX "calculation_history_isLocked_idx" ON "calculation_history"("isLocked");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "snapshot_asset_values_snapshotId_idx" ON "snapshot_asset_values"("snapshotId");

-- CreateIndex
CREATE INDEX "snapshot_asset_values_assetId_idx" ON "snapshot_asset_values"("assetId");

-- CreateIndex
CREATE INDEX "methodology_configs_userId_idx" ON "methodology_configs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_security_userId_key" ON "user_security"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_expiresAt_idx" ON "password_resets"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
