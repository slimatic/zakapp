-- CreateTable
CREATE TABLE "yearly_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "calculationDate" DATETIME NOT NULL,
    "gregorianYear" INTEGER NOT NULL,
    "gregorianMonth" INTEGER NOT NULL,
    "gregorianDay" INTEGER NOT NULL,
    "hijriYear" INTEGER NOT NULL,
    "hijriMonth" INTEGER NOT NULL,
    "hijriDay" INTEGER NOT NULL,
    "totalWealth" TEXT NOT NULL,
    "totalLiabilities" TEXT NOT NULL,
    "zakatableWealth" TEXT NOT NULL,
    "zakatAmount" TEXT NOT NULL,
    "methodologyUsed" TEXT NOT NULL,
    "nisabThreshold" TEXT NOT NULL,
    "nisabType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assetBreakdown" TEXT NOT NULL,
    "calculationDetails" TEXT NOT NULL,
    "userNotes" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "yearly_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientCategory" TEXT NOT NULL,
    "notes" TEXT,
    "receiptReference" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payment_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payment_records_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "yearly_snapshots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "calculatedValue" TEXT NOT NULL,
    "visualizationType" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "analytics_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "annual_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "gregorianYear" INTEGER NOT NULL,
    "hijriYear" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "totalZakatCalculated" TEXT NOT NULL,
    "totalZakatPaid" TEXT NOT NULL,
    "outstandingZakat" TEXT NOT NULL,
    "numberOfPayments" INTEGER NOT NULL,
    "recipientSummary" TEXT NOT NULL,
    "assetBreakdown" TEXT NOT NULL,
    "comparativeAnalysis" TEXT NOT NULL,
    "methodologyUsed" TEXT NOT NULL,
    "nisabInfo" TEXT NOT NULL,
    "userNotes" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "annual_summaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "annual_summaries_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "yearly_snapshots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminder_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "triggerDate" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "relatedSnapshotId" TEXT,
    "metadata" TEXT,
    "acknowledgedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reminder_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminder_events_relatedSnapshotId_fkey" FOREIGN KEY ("relatedSnapshotId") REFERENCES "yearly_snapshots" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_calculationDate_idx" ON "yearly_snapshots"("userId", "calculationDate" DESC);

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_gregorianYear_idx" ON "yearly_snapshots"("userId", "gregorianYear");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_hijriYear_idx" ON "yearly_snapshots"("userId", "hijriYear");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_status_idx" ON "yearly_snapshots"("userId", "status");

-- CreateIndex
CREATE INDEX "payment_records_userId_paymentDate_idx" ON "payment_records"("userId", "paymentDate" DESC);

-- CreateIndex
CREATE INDEX "payment_records_snapshotId_idx" ON "payment_records"("snapshotId");

-- CreateIndex
CREATE INDEX "analytics_metrics_userId_metricType_expiresAt_idx" ON "analytics_metrics"("userId", "metricType", "expiresAt");

-- CreateIndex
CREATE INDEX "analytics_metrics_expiresAt_idx" ON "analytics_metrics"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "annual_summaries_snapshotId_key" ON "annual_summaries"("snapshotId");

-- CreateIndex
CREATE INDEX "annual_summaries_userId_gregorianYear_idx" ON "annual_summaries"("userId", "gregorianYear");

-- CreateIndex
CREATE INDEX "annual_summaries_userId_hijriYear_idx" ON "annual_summaries"("userId", "hijriYear");

-- CreateIndex
CREATE INDEX "annual_summaries_snapshotId_idx" ON "annual_summaries"("snapshotId");

-- CreateIndex
CREATE INDEX "reminder_events_userId_triggerDate_idx" ON "reminder_events"("userId", "triggerDate");

-- CreateIndex
CREATE INDEX "reminder_events_userId_status_idx" ON "reminder_events"("userId", "status");
