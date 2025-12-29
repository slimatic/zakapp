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
    "preferredCalendar" TEXT DEFAULT 'gregorian',
    "preferredMethodology" TEXT DEFAULT 'standard',
    "lastZakatDate" DATETIME
);
INSERT INTO "new_users" ("createdAt", "email", "id", "isActive", "lastLoginAt", "lastZakatDate", "passwordHash", "preferredCalendar", "preferredMethodology", "profile", "settings", "updatedAt", "username") SELECT "createdAt", "email", "id", "isActive", "lastLoginAt", "lastZakatDate", "passwordHash", "preferredCalendar", "preferredMethodology", "profile", "settings", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
