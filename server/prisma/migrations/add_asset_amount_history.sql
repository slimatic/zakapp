-- Migration: add_asset_amount_history
-- Description: Add tables for tracking asset amount history with audit trail
-- Created: 2026-03-01

-- Create AssetAmountEvent table
CREATE TABLE IF NOT EXISTS "asset_amount_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
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

-- Create AssetAmountSnapshot table
CREATE TABLE IF NOT EXISTS "asset_amount_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE,
    UNIQUE ("assetId", "date")
);

-- Create indexes for asset_amount_events
CREATE INDEX IF NOT EXISTS "asset_amount_events_assetId_effectiveDate" ON "asset_amount_events" ("assetId", "effectiveDate");
CREATE INDEX IF NOT EXISTS "asset_amount_events_assetId_recordedAt" ON "asset_amount_events" ("assetId", "recordedAt");
CREATE INDEX IF NOT EXISTS "asset_amount_events_userId_effectiveDate" ON "asset_amount_events" ("userId", "effectiveDate");
CREATE INDEX IF NOT EXISTS "asset_amount_events_eventType" ON "asset_amount_events" ("eventType");
CREATE INDEX IF NOT EXISTS "asset_amount_events_isReversed" ON "asset_amount_events" ("isReversed");

-- Create indexes for asset_amount_snapshots
CREATE INDEX IF NOT EXISTS "asset_amount_snapshots_assetId" ON "asset_amount_snapshots" ("assetId");
CREATE INDEX IF NOT EXISTS "asset_amount_snapshots_date" ON "asset_amount_snapshots" ("date");

-- Add optional relation column to audit_trail_entries for asset events
ALTER TABLE "audit_trail_entries" ADD COLUMN "assetAmountEventId" TEXT;
