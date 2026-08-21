import { describe, expect, it } from "vitest";
import { fileRecord } from "@/lib/filing";
import { db } from "@/lib/db";
import type { AppUser } from "@/lib/auth/types";

const user: AppUser = {
  oid: "test-patroller",
  displayName: "Test Patroller",
  email: "test@example.invalid",
  roles: ["PS-Members"],
  sessionId: "test-session",
  surface: "field",
};

const NARRATIVE = "UNIQUE-NARRATIVE-7f3a confidential words that must never reach the db";

function input(idempotencyKey: string) {
  return {
    user,
    recordTypeId: "RT-CFS",
    categoryId: "CAT-WEL",
    locationId: "LOC-NS-01",
    recordDate: "2031-04-01",
    capturedAt: new Date().toISOString(),
    idempotencyKey,
    content: { buffer: Buffer.from(NARRATIVE, "utf8"), contentType: "text/plain" },
  };
}

describe("filing", () => {
  it("the same idempotency key cannot double-file", async () => {
    const key = crypto.randomUUID();
    const first = await fileRecord(input(key));
    const second = await fileRecord(input(key));
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);
    expect(second.occurrenceNumber).toBe(first.occurrenceNumber);
  });

  it("no narrative content reaches the application database", async () => {
    await fileRecord(input(crypto.randomUUID()));
    // Sweep every operational table for the narrative string
    const tables = [
      "User", "Session", "DeviceToken", "AuditEntry", "OccurrenceSequence",
      "OccurrenceBlock", "IdempotencyKey", "AppConfig", "Shift", "TrackerQueue",
    ];
    for (const table of tables) {
      const rows = await db.$queryRawUnsafe<unknown[]>(`SELECT * FROM "${table}"`);
      expect(
        JSON.stringify(rows).includes("UNIQUE-NARRATIVE-7f3a"),
        `narrative leaked into ${table}`,
      ).toBe(false);
    }
  });
});
