-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "smtpFromEmail" TEXT,
    "smtpFromName" TEXT,
    "emailProvider" TEXT NOT NULL DEFAULT 'smtp',
    "resendApiKey" TEXT,
    "requireEmailVerification" BOOLEAN NOT NULL DEFAULT false,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT NOT NULL,
    "profile" TEXT,
    "settings" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userType" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "verificationTokenExpires" DATETIME,
    "preferredCalendar" TEXT DEFAULT 'gregorian',
    "preferredMethodology" TEXT DEFAULT 'standard',
    "lastZakatDate" DATETIME,
    "maxAssets" INTEGER,
    "maxNisabRecords" INTEGER,
    "maxPayments" INTEGER,
    "maxLiabilities" INTEGER
);
INSERT INTO "new_users" ("createdAt", "email", "id", "isActive", "lastLoginAt", "lastZakatDate", "maxAssets", "maxLiabilities", "maxNisabRecords", "maxPayments", "passwordHash", "preferredCalendar", "preferredMethodology", "profile", "settings", "updatedAt", "userType", "username") SELECT "createdAt", "email", "id", "isActive", "lastLoginAt", "lastZakatDate", "maxAssets", "maxLiabilities", "maxNisabRecords", "maxPayments", "passwordHash", "preferredCalendar", "preferredMethodology", "profile", "settings", "updatedAt", "userType", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_verificationToken_key" ON "users"("verificationToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
