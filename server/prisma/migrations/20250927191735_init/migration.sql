-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "profile" TEXT,
    "settings" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME,
    "updatedAt" DATETIME NOT NULL
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
    "snapshotDate" DATETIME NOT NULL,
    "snapshotType" TEXT NOT NULL,
    "totalValue" REAL NOT NULL,
    "assetCount" INTEGER NOT NULL,
    "assetsData" TEXT NOT NULL,
    "liabilitiesData" TEXT NOT NULL,
    "exchangeRates" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "assets_userId_idx" ON "assets"("userId");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE INDEX "liabilities_userId_idx" ON "liabilities"("userId");

-- CreateIndex
CREATE INDEX "zakat_calculations_userId_idx" ON "zakat_calculations"("userId");

-- CreateIndex
CREATE INDEX "zakat_calculations_calculationDate_idx" ON "zakat_calculations"("calculationDate");

-- CreateIndex
CREATE INDEX "asset_snapshots_userId_idx" ON "asset_snapshots"("userId");

-- CreateIndex
CREATE INDEX "asset_snapshots_snapshotDate_idx" ON "asset_snapshots"("snapshotDate");

-- CreateIndex
CREATE INDEX "zakat_payments_userId_idx" ON "zakat_payments"("userId");

-- CreateIndex
CREATE INDEX "zakat_payments_paymentDate_idx" ON "zakat_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "zakat_payments_islamicYear_idx" ON "zakat_payments"("islamicYear");

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
