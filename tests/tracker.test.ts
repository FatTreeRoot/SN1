import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import columnsJson from "@/config/columns.json";
import { fileRecord } from "@/lib/filing";
import { processTrackerQueue } from "@/lib/excel/tracker";
import { db } from "@/lib/db";
import type { AppUser } from "@/lib/auth/types";

const user: AppUser = {
  oid: "test-tracker-user",
  displayName: "Tracker Tester",
  email: "tracker@example.invalid",
  roles: ["PS-Members"],
  sessionId: "test-session",
  surface: "field",
};

const trackerPath = path.resolve("./.mock-storage-test/PS-Confidential/Tracker.csv");

function submit() {
  return fileRecord({
    user,
    recordTypeId: "RT-CFS",
    categoryId: "CAT-NOI",
    locationId: "LOC-SV-01",
    recordDate: "2031-05-01",
    capturedAt: new Date().toISOString(),
    idempotencyKey: crypto.randomUUID(),
    content: { buffer: Buffer.from("tracker test", "utf8"), contentType: "text/plain" },
  });
}

describe("excel tracker", () => {
  it("appends a row for tracked types, never rewriting earlier rows", async () => {
    const first = await submit();
    const afterFirst = (await readFile(trackerPath, "utf8")).trimEnd().split("\n");
    const second = await submit();
    const afterSecond = (await readFile(trackerPath, "utf8")).trimEnd().split("\n");

    expect(afterSecond.length).toBe(afterFirst.length + 1);
    // Earlier rows are byte-identical — append-only
    expect(afterSecond.slice(0, afterFirst.length)).toEqual(afterFirst);
    expect(afterSecond.some((l) => l.includes(first.occurrenceNumber))).toBe(true);
    expect(afterSecond.at(-1)).toContain(second.occurrenceNumber);
  });

  it("header drift keeps the row queued and raises an alert instead of miswriting", async () => {
    // Someone renamed a column in the workbook
    const content = await readFile(trackerPath, "utf8");
    const lines = content.split("\n");
    lines[0] = lines[0].replace(columnsJson.columns.categoryName, "Renamed Column");
    await writeFile(trackerPath, lines.join("\n"));
    const rowCountBefore = lines.filter(Boolean).length;

    const result = await submit(); // filing itself must still succeed
    expect(result.occurrenceNumber).toBeTruthy();

    const after = (await readFile(trackerPath, "utf8")).split("\n").filter(Boolean);
    expect(after.length).toBe(rowCountBefore); // nothing written into wrong columns

    const pending = await db.trackerQueue.findMany({ where: { status: "pending" } });
    expect(pending.length).toBeGreaterThan(0);

    const alert = await db.auditEntry.findFirst({ where: { action: "tracker-drift-alert" } });
    expect(alert).not.toBeNull();

    // Repair the header; the queued row drains on the next pass
    await writeFile(trackerPath, content.split("\n").join("\n"));
    const drained = await processTrackerQueue();
    expect(drained.pending).toBe(0);
  });
});
