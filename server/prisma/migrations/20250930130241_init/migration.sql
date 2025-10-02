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
