-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userOid" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "areaName" TEXT NOT NULL,
    "partnerOid" TEXT,
    "partnerName" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "Shift_userOid_endedAt_idx" ON "Shift"("userOid", "endedAt");
