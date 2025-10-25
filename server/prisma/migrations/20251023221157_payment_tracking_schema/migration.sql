-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT NOT NULL,
    "profile" TEXT,
    "settings" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "preferredCalendar" TEXT DEFAULT 'gregorian',
    "preferredMethodology" TEXT DEFAULT 'standard',
    "lastZakatDate" DATETIME
);

-- CreateTable
CREATE TABLE "assets" (
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
    CONSTRAINT "assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "liabilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "creditor" TEXT,
    "dueDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "liabilities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "zakat_calculations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "calculationDate" DATETIME NOT NULL,
    "methodology" TEXT NOT NULL,
    "calendarType" TEXT NOT NULL,
    "totalAssets" REAL NOT NULL,
    "totalLiabilities" REAL NOT NULL,
    "netWorth" REAL NOT NULL,
    "nisabThreshold" REAL NOT NULL,
    "nisabSource" TEXT NOT NULL,
    "isZakatObligatory" BOOLEAN NOT NULL,
    "zakatAmount" REAL NOT NULL,
    "zakatRate" REAL NOT NULL DEFAULT 0.025,
    "breakdown" TEXT NOT NULL,
    "assetsIncluded" TEXT NOT NULL,
    "liabilitiesIncluded" TEXT NOT NULL,
    "regionalAdjustments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "zakat_calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "asset_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "snapshotDate" DATETIME NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "totalValue" REAL NOT NULL,
    "totalAssets" REAL,
    "totalLiabilities" REAL,
    "netWorth" REAL,
    "assetCount" INTEGER NOT NULL,
    "liabilitiesCount" INTEGER,
    "assetsData" TEXT NOT NULL,
    "liabilitiesData" TEXT NOT NULL,
    "exchangeRates" TEXT NOT NULL,
    "islamicYear" TEXT,
    "tags" TEXT,
    "metadata" TEXT,
    "notes" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "zakat_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "calculationId" TEXT,
    "paymentDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "recipients" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "receiptNumber" TEXT,
    "islamicYear" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "verificationDetails" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "zakat_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "zakat_payments_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "zakat_calculations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calculation_methodologies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scholarlySource" TEXT NOT NULL,
    "nisabCalculation" TEXT NOT NULL,
    "assetRules" TEXT NOT NULL,
    "liabilityRules" TEXT NOT NULL,
    "calendarRules" TEXT NOT NULL,
    "zakatRates" TEXT NOT NULL,
    "regionalVariations" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "nisab_thresholds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "effectiveDate" DATETIME NOT NULL,
    "goldPricePerGram" REAL NOT NULL,
    "silverPricePerGram" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "goldNisabGrams" REAL NOT NULL DEFAULT 87.48,
    "silverNisabGrams" REAL NOT NULL DEFAULT 612.36,
    "goldNisabValue" REAL NOT NULL,
    "silverNisabValue" REAL NOT NULL,
    "priceSource" TEXT NOT NULL,
    "exchangeRates" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "issuedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "refreshedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "terminatedAt" DATETIME,
    "terminationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testType" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "executionTime" INTEGER NOT NULL,
    "coverage" REAL NOT NULL,
    "errors" TEXT,
    "metadata" TEXT,
    "feature" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "implementationGapId" TEXT,
    CONSTRAINT "test_results_implementationGapId_fkey" FOREIGN KEY ("implementationGapId") REFERENCES "implementation_gaps" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "implementation_gaps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expectedBehavior" TEXT NOT NULL,
    "actualBehavior" TEXT NOT NULL,
    "affectedComponents" TEXT,
    "constitutionalPrinciple" TEXT NOT NULL,
    "resolutionPlan" TEXT NOT NULL,
    "estimatedEffort" INTEGER NOT NULL,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "quality_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricType" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "currentValue" REAL NOT NULL,
    "targetValue" REAL NOT NULL,
    "thresholdMin" REAL,
    "thresholdMax" REAL,
    "thresholdOptimal" REAL,
    "unit" TEXT NOT NULL,
    "measurementDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "component" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "trend" TEXT NOT NULL,
    "automatedCollection" BOOLEAN NOT NULL DEFAULT false,
    "testResultId" TEXT,
    "implementationGapId" TEXT,
    CONSTRAINT "quality_metrics_testResultId_fkey" FOREIGN KEY ("testResultId") REFERENCES "test_results" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_metrics_implementationGapId_fkey" FOREIGN KEY ("implementationGapId") REFERENCES "implementation_gaps" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "migration_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "migrationName" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceLocation" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "failureCount" INTEGER NOT NULL,
    "checksumBefore" TEXT NOT NULL,
    "checksumAfter" TEXT,
    "migrationLog" TEXT NOT NULL,
    "rollbackData" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "duration" INTEGER
);

-- CreateTable
CREATE TABLE "compliance_verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calculationType" TEXT NOT NULL,
    "inputData" TEXT NOT NULL,
    "expectedResult" REAL NOT NULL,
    "actualResult" REAL NOT NULL,
    "accuracy" REAL NOT NULL,
    "authoritativeSource" TEXT NOT NULL,
    "sourceCitation" TEXT NOT NULL,
    "verificationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "methodology" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "marketData" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "api_contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "requestSchema" TEXT NOT NULL,
    "responseSchema" TEXT NOT NULL,
    "authenticationRequired" BOOLEAN NOT NULL DEFAULT false,
    "rateLimitingRpm" INTEGER,
    "rateLimitingRph" INTEGER,
    "rateLimitingBurst" INTEGER,
    "expectedStatusCodes" TEXT,
    "errorHandling" TEXT,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "complianceStatus" TEXT NOT NULL,
    "testCoverage" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "user_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "prerequisites" TEXT,
    "testAutomated" BOOLEAN NOT NULL DEFAULT false,
    "criticalPath" BOOLEAN NOT NULL DEFAULT false,
    "estimatedDuration" INTEGER NOT NULL,
    "lastTested" DATETIME,
    "successRate" REAL NOT NULL,
    "commonFailures" TEXT,
    "browserChrome" BOOLEAN NOT NULL DEFAULT false,
    "browserFirefox" BOOLEAN NOT NULL DEFAULT false,
    "browserSafari" BOOLEAN NOT NULL DEFAULT false,
    "browserEdge" BOOLEAN NOT NULL DEFAULT false
);

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
    "calculationId" TEXT,
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
    CONSTRAINT "payment_records_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "yearly_snapshots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payment_records_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "zakat_calculations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "calculation_history" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calculation_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "calculation_history_methodologyConfigId_fkey" FOREIGN KEY ("methodologyConfigId") REFERENCES "methodology_configs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    CONSTRAINT "snapshot_asset_values_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "calculation_snapshots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "snapshot_asset_values_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "methodology_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calculation_snapshots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "calculationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "methodology" TEXT NOT NULL,
    "methodologyConfigId" TEXT,
    "totalWealth" TEXT NOT NULL,
    "zakatDue" TEXT NOT NULL,
    "nisabThreshold" TEXT NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "lockedAt" DATETIME,
    "unlockedAt" DATETIME,
    "unlockedBy" TEXT,
    "unlockReason" TEXT,
    "calendarType" TEXT NOT NULL,
    "zakatYearStart" DATETIME NOT NULL,
    "zakatYearEnd" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "calculation_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "calculation_snapshots_methodologyConfigId_fkey" FOREIGN KEY ("methodologyConfigId") REFERENCES "methodology_configs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "assets_userId_idx" ON "assets"("userId");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE INDEX "assets_userId_category_idx" ON "assets"("userId", "category");

-- CreateIndex
CREATE INDEX "assets_userId_isActive_idx" ON "assets"("userId", "isActive");

-- CreateIndex
CREATE INDEX "assets_acquisitionDate_idx" ON "assets"("acquisitionDate");

-- CreateIndex
CREATE INDEX "liabilities_userId_idx" ON "liabilities"("userId");

-- CreateIndex
CREATE INDEX "liabilities_type_idx" ON "liabilities"("type");

-- CreateIndex
CREATE INDEX "liabilities_userId_type_idx" ON "liabilities"("userId", "type");

-- CreateIndex
CREATE INDEX "liabilities_userId_isActive_idx" ON "liabilities"("userId", "isActive");

-- CreateIndex
CREATE INDEX "liabilities_dueDate_idx" ON "liabilities"("dueDate");

-- CreateIndex
CREATE INDEX "zakat_calculations_userId_idx" ON "zakat_calculations"("userId");

-- CreateIndex
CREATE INDEX "zakat_calculations_calculationDate_idx" ON "zakat_calculations"("calculationDate");

-- CreateIndex
CREATE INDEX "zakat_calculations_userId_calculationDate_idx" ON "zakat_calculations"("userId", "calculationDate" DESC);

-- CreateIndex
CREATE INDEX "zakat_calculations_methodology_idx" ON "zakat_calculations"("methodology");

-- CreateIndex
CREATE INDEX "zakat_calculations_calendarType_idx" ON "zakat_calculations"("calendarType");

-- CreateIndex
CREATE INDEX "asset_snapshots_userId_idx" ON "asset_snapshots"("userId");

-- CreateIndex
CREATE INDEX "asset_snapshots_snapshotDate_idx" ON "asset_snapshots"("snapshotDate");

-- CreateIndex
CREATE INDEX "asset_snapshots_userId_snapshotDate_idx" ON "asset_snapshots"("userId", "snapshotDate" DESC);

-- CreateIndex
CREATE INDEX "asset_snapshots_snapshotType_idx" ON "asset_snapshots"("snapshotType");

-- CreateIndex
CREATE INDEX "asset_snapshots_isLocked_idx" ON "asset_snapshots"("isLocked");

-- CreateIndex
CREATE INDEX "asset_snapshots_userId_isLocked_idx" ON "asset_snapshots"("userId", "isLocked");

-- CreateIndex
CREATE INDEX "zakat_payments_userId_idx" ON "zakat_payments"("userId");

-- CreateIndex
CREATE INDEX "zakat_payments_paymentDate_idx" ON "zakat_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "zakat_payments_islamicYear_idx" ON "zakat_payments"("islamicYear");

-- CreateIndex
CREATE INDEX "zakat_payments_userId_paymentDate_idx" ON "zakat_payments"("userId", "paymentDate" DESC);

-- CreateIndex
CREATE INDEX "zakat_payments_userId_islamicYear_idx" ON "zakat_payments"("userId", "islamicYear");

-- CreateIndex
CREATE INDEX "zakat_payments_calculationId_idx" ON "zakat_payments"("calculationId");

-- CreateIndex
CREATE INDEX "zakat_payments_status_idx" ON "zakat_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "calculation_methodologies_name_key" ON "calculation_methodologies"("name");

-- CreateIndex
CREATE INDEX "nisab_thresholds_effectiveDate_idx" ON "nisab_thresholds"("effectiveDate");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_accessToken_idx" ON "user_sessions"("accessToken");

-- CreateIndex
CREATE INDEX "user_sessions_refreshToken_idx" ON "user_sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "user_sessions_expiresAt_idx" ON "user_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "test_results_testType_status_createdAt_idx" ON "test_results"("testType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "test_results_feature_idx" ON "test_results"("feature");

-- CreateIndex
CREATE UNIQUE INDEX "test_results_testType_testName_key" ON "test_results"("testType", "testName");

-- CreateIndex
CREATE INDEX "implementation_gaps_severity_status_idx" ON "implementation_gaps"("severity", "status");

-- CreateIndex
CREATE INDEX "implementation_gaps_category_idx" ON "implementation_gaps"("category");

-- CreateIndex
CREATE INDEX "quality_metrics_metricType_component_measurementDate_idx" ON "quality_metrics"("metricType", "component", "measurementDate");

-- CreateIndex
CREATE INDEX "quality_metrics_environment_idx" ON "quality_metrics"("environment");

-- CreateIndex
CREATE INDEX "migration_records_status_sourceType_idx" ON "migration_records"("status", "sourceType");

-- CreateIndex
CREATE INDEX "migration_records_migrationName_idx" ON "migration_records"("migrationName");

-- CreateIndex
CREATE INDEX "compliance_verifications_calculationType_status_idx" ON "compliance_verifications"("calculationType", "status");

-- CreateIndex
CREATE INDEX "compliance_verifications_verificationDate_idx" ON "compliance_verifications"("verificationDate");

-- CreateIndex
CREATE INDEX "api_contracts_endpoint_method_idx" ON "api_contracts"("endpoint", "method");

-- CreateIndex
CREATE INDEX "api_contracts_complianceStatus_idx" ON "api_contracts"("complianceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "api_contracts_endpoint_method_version_key" ON "api_contracts"("endpoint", "method", "version");

-- CreateIndex
CREATE INDEX "user_workflows_criticalPath_testAutomated_idx" ON "user_workflows"("criticalPath", "testAutomated");

-- CreateIndex
CREATE INDEX "user_workflows_workflowName_idx" ON "user_workflows"("workflowName");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_calculationDate_idx" ON "yearly_snapshots"("userId", "calculationDate" DESC);

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_gregorianYear_idx" ON "yearly_snapshots"("userId", "gregorianYear");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_hijriYear_idx" ON "yearly_snapshots"("userId", "hijriYear");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_status_idx" ON "yearly_snapshots"("userId", "status");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_isPrimary_idx" ON "yearly_snapshots"("userId", "isPrimary");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_createdAt_idx" ON "yearly_snapshots"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_gregorianYear_gregorianMonth_idx" ON "yearly_snapshots"("userId", "gregorianYear", "gregorianMonth");

-- CreateIndex
CREATE INDEX "yearly_snapshots_userId_status_gregorianYear_idx" ON "yearly_snapshots"("userId", "status", "gregorianYear");

-- CreateIndex
CREATE INDEX "payment_records_userId_paymentDate_idx" ON "payment_records"("userId", "paymentDate" DESC);

-- CreateIndex
CREATE INDEX "payment_records_snapshotId_idx" ON "payment_records"("snapshotId");

-- CreateIndex
CREATE INDEX "payment_records_userId_snapshotId_idx" ON "payment_records"("userId", "snapshotId");

-- CreateIndex
CREATE INDEX "payment_records_userId_status_idx" ON "payment_records"("userId", "status");

-- CreateIndex
CREATE INDEX "payment_records_userId_recipientCategory_idx" ON "payment_records"("userId", "recipientCategory");

-- CreateIndex
CREATE INDEX "payment_records_userId_createdAt_idx" ON "payment_records"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "analytics_metrics_userId_metricType_expiresAt_idx" ON "analytics_metrics"("userId", "metricType", "expiresAt");

-- CreateIndex
CREATE INDEX "analytics_metrics_expiresAt_idx" ON "analytics_metrics"("expiresAt");

-- CreateIndex
CREATE INDEX "analytics_metrics_userId_metricType_startDate_endDate_idx" ON "analytics_metrics"("userId", "metricType", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "analytics_metrics_userId_calculatedAt_idx" ON "analytics_metrics"("userId", "calculatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "annual_summaries_snapshotId_key" ON "annual_summaries"("snapshotId");

-- CreateIndex
CREATE INDEX "annual_summaries_userId_gregorianYear_idx" ON "annual_summaries"("userId", "gregorianYear");

-- CreateIndex
CREATE INDEX "annual_summaries_userId_hijriYear_idx" ON "annual_summaries"("userId", "hijriYear");

-- CreateIndex
CREATE INDEX "annual_summaries_snapshotId_idx" ON "annual_summaries"("snapshotId");

-- CreateIndex
CREATE INDEX "annual_summaries_userId_generatedAt_idx" ON "annual_summaries"("userId", "generatedAt" DESC);

-- CreateIndex
CREATE INDEX "reminder_events_userId_triggerDate_idx" ON "reminder_events"("userId", "triggerDate");

-- CreateIndex
CREATE INDEX "reminder_events_userId_status_idx" ON "reminder_events"("userId", "status");

-- CreateIndex
CREATE INDEX "reminder_events_userId_eventType_idx" ON "reminder_events"("userId", "eventType");

-- CreateIndex
CREATE INDEX "reminder_events_userId_status_triggerDate_idx" ON "reminder_events"("userId", "status", "triggerDate");

-- CreateIndex
CREATE INDEX "reminder_events_userId_priority_status_idx" ON "reminder_events"("userId", "priority", "status");

-- CreateIndex
CREATE INDEX "calculation_history_userId_calculationDate_idx" ON "calculation_history"("userId", "calculationDate");

-- CreateIndex
CREATE INDEX "calculation_history_userId_methodology_idx" ON "calculation_history"("userId", "methodology");

-- CreateIndex
CREATE INDEX "calculation_history_calculationDate_idx" ON "calculation_history"("calculationDate");

-- CreateIndex
CREATE INDEX "calculation_history_isLocked_idx" ON "calculation_history"("isLocked");

-- CreateIndex
CREATE INDEX "snapshot_asset_values_snapshotId_idx" ON "snapshot_asset_values"("snapshotId");

-- CreateIndex
CREATE INDEX "snapshot_asset_values_assetId_idx" ON "snapshot_asset_values"("assetId");

-- CreateIndex
CREATE INDEX "methodology_configs_userId_idx" ON "methodology_configs"("userId");

-- CreateIndex
CREATE INDEX "calculation_snapshots_userId_calculationDate_idx" ON "calculation_snapshots"("userId", "calculationDate");

-- CreateIndex
CREATE INDEX "calculation_snapshots_methodology_idx" ON "calculation_snapshots"("methodology");

-- CreateIndex
CREATE INDEX "calculation_snapshots_isLocked_idx" ON "calculation_snapshots"("isLocked");

-- CreateIndex
CREATE INDEX "calculation_snapshots_userId_isLocked_idx" ON "calculation_snapshots"("userId", "isLocked");

-- CreateIndex
CREATE INDEX "calculation_snapshots_userId_methodology_idx" ON "calculation_snapshots"("userId", "methodology");

-- CreateIndex
CREATE INDEX "calculation_snapshots_zakatYearStart_idx" ON "calculation_snapshots"("zakatYearStart");

-- CreateIndex
CREATE INDEX "calculation_snapshots_zakatYearEnd_idx" ON "calculation_snapshots"("zakatYearEnd");

-- CreateIndex
CREATE UNIQUE INDEX "user_security_userId_key" ON "user_security"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_expiresAt_idx" ON "password_resets"("expiresAt");
