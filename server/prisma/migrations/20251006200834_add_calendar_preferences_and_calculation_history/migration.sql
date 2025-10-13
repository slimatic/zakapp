-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastZakatDate" DATETIME;
ALTER TABLE "users" ADD COLUMN "preferredCalendar" TEXT DEFAULT 'gregorian';
ALTER TABLE "users" ADD COLUMN "preferredMethodology" TEXT DEFAULT 'standard';

-- CreateTable
CREATE TABLE "calculation_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "calendarType" TEXT NOT NULL,
    "calculationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalWealth" TEXT NOT NULL,
    "nisabThreshold" TEXT NOT NULL,
    "zakatDue" TEXT NOT NULL,
    "zakatRate" REAL NOT NULL DEFAULT 2.5,
    "assetBreakdown" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "calculation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "calculation_history_userId_calculationDate_idx" ON "calculation_history"("userId", "calculationDate");

-- CreateIndex
CREATE INDEX "calculation_history_userId_methodology_idx" ON "calculation_history"("userId", "methodology");

-- CreateIndex
CREATE INDEX "calculation_history_calculationDate_idx" ON "calculation_history"("calculationDate");
