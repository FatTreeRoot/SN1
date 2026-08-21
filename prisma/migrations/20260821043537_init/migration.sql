-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entraOid" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedUseAt" DATETIME
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "deviceTokenId" TEXT,
    "deviceLabel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME,
    CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorOid" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "surface" TEXT,
    "recordType" TEXT,
    "itemId" TEXT,
    "detail" TEXT
);

-- CreateTable
CREATE TABLE "OccurrenceSequence" (
    "dateKey" TEXT NOT NULL PRIMARY KEY,
    "nextSeq" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "OccurrenceBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dateKey" TEXT NOT NULL,
    "startSeq" INTEGER NOT NULL,
    "endSeq" INTEGER NOT NULL,
    "issuedTo" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "actorOid" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurrence" TEXT,
    "itemId" TEXT,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AppConfig" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "User_entraOid_key" ON "User"("entraOid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_revokedAt_idx" ON "DeviceToken"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "AuditEntry_actorOid_at_idx" ON "AuditEntry"("actorOid", "at");

-- CreateIndex
CREATE INDEX "AuditEntry_action_at_idx" ON "AuditEntry"("action", "at");

-- CreateIndex
CREATE INDEX "OccurrenceBlock_issuedTo_dateKey_idx" ON "OccurrenceBlock"("issuedTo", "dateKey");
