-- Migration: add_asset_amount_history
-- Description: Add tables for tracking asset amount history with audit trail
-- Created: 2026-03-01

-- Create AssetAmountEvent table
CREATE TABLE IF NOT EXISTS "asset_amount_events" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (uuid()),
    "assetId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effectiveDate" TEXT NOT NULL,
    "recordedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "userId" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "metadata" TEXT,
    "isReversed" INTEGER NOT NULL DEFAULT 0,
    "originalEventId" TEXT,
    FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE
);

-- Create index for assetId + effectiveDate
CREATE INDEX IF NOT EXISTS "asset_amount_events_assetId_effectiveDate" ON "asset_amount_events" ("assetId", "effectiveDate");

-- Create index for assetId + recordedAt
CREATE INDEX IF NOT EXISTS "asset_amount_events_assetId_recordedAt" ON "asset_amount_events" ("assetId", "recordedAt");

-- Create index for userId + effectiveDate
CREATE INDEX IF NOT EXISTS "asset_amount_events_userId_effectiveDate" ON "asset_amount_events" ("userId", "effectiveDate");

-- Create index for eventType
CREATE INDEX IF NOT EXISTS "asset_amount_events_eventType" ON "asset_amount_events" ("eventType");

-- Create index for isReversed
CREATE INDEX IF NOT EXISTS "asset_amount_events_isReversed" ON "asset_amount_events" ("isReversed");

-- Create AssetAmountSnapshot table
CREATE TABLE IF NOT EXISTS "asset_amount_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT (uuid()),
    "assetId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE,
    UNIQUE ("assetId", "date")
);

-- Create index for assetId
CREATE INDEX IF NOT EXISTS "asset_amount_snapshots_assetId" ON "asset_amount_snapshots" ("assetId");

-- Create index for date
CREATE INDEX IF NOT EXISTS "asset_amount_snapshots_date" ON "asset_amount_snapshots" ("date");

-- Add unique constraint column to audit_trail_entries for optional relation
ALTER TABLE "audit_trail_entries" ADD COLUMN "assetAmountEventId" TEXT UNIQUE;

-- Add foreign key constraint (optional)
-- Note: This may fail if the column already has data that doesn't match, 
-- so we'll make it optional by not adding the FK constraint
