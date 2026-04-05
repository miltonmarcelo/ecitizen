/*
  Warnings:

  - You are about to drop the column `eircode` on the `Issue` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Issue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "caseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" INTEGER,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "town" TEXT,
    "city" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "citizenId" INTEGER NOT NULL,
    "staffId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Issue_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Issue_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("addressLine1", "addressLine2", "caseId", "categoryId", "citizenId", "city", "county", "createdAt", "description", "id", "staffId", "status", "title", "town", "updatedAt") SELECT "addressLine1", "addressLine2", "caseId", "categoryId", "citizenId", "city", "county", "createdAt", "description", "id", "staffId", "status", "title", "town", "updatedAt" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE UNIQUE INDEX "Issue_caseId_key" ON "Issue"("caseId");
CREATE INDEX "Issue_citizenId_idx" ON "Issue"("citizenId");
CREATE INDEX "Issue_staffId_idx" ON "Issue"("staffId");
CREATE INDEX "Issue_status_idx" ON "Issue"("status");
CREATE INDEX "Issue_categoryId_idx" ON "Issue"("categoryId");
CREATE INDEX "Issue_createdAt_idx" ON "Issue"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
