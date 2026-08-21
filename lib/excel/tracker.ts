import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import columnsJson from "@/config/columns.json";
import { appendAudit } from "@/lib/auth/audit";
import { db } from "@/lib/db";
import { getStorageAdapter, type RecordMetadata } from "@/lib/storage";

/**
 * The confidential Excel tracker. The application appends rows and does
 * nothing else to the file: never rewrite, reorder, or overwrite. A
 * correction appends a new row marking the earlier one superseded.
 *
 * Column mapping lives in config/columns.json. The header row is validated
 * on every append; drift raises an alert instead of writing into the wrong
 * column silently. A locked workbook fails the append, keeps the row
 * queued, and retries — the record itself is already safely filed.
 *
 * The mock appender simulates the named table with a CSV alongside mock
 * storage; the production appender uses the Graph workbook API against a
 * real named table (checkpoint 10, documented in docs/IT-REQUEST.md).
 */

const mapping = columnsJson.columns as Record<string, string>;
const headerRow = Object.values(mapping);

/** Record types that append to the tracker (the incident tracker, not
 *  operational paperwork). */
const TRACKED_TYPES = new Set(["RT-CFS", "RT-ESC", "RT-CEM", "RT-CCI"]);

export function isTracked(recordTypeId: string): boolean {
  return TRACKED_TYPES.has(recordTypeId);
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function rowFor(meta: RecordMetadata): string {
  return Object.keys(mapping)
    .map((field) => csvEscape(String((meta as unknown as Record<string, unknown>)[field] ?? "")))
    .join(",");
}

class MockTrackerAppender {
  private file = path.resolve(
    process.env.MOCK_STORAGE_DIR ?? "./.mock-storage",
    "PS-Confidential",
    "Tracker.csv",
  );

  async ensure(): Promise<void> {
    await mkdir(path.dirname(this.file), { recursive: true });
    try {
      await readFile(this.file);
    } catch {
      await writeFile(this.file, headerRow.map(csvEscape).join(",") + "\n");
    }
  }

  /** Header validation on every append — the drift alarm. */
  async validateHeaders(): Promise<void> {
    await this.ensure();
    const firstLine = (await readFile(this.file, "utf8")).split("\n", 1)[0].trim();
    const expected = headerRow.map(csvEscape).join(",");
    if (firstLine !== expected) {
      throw new TrackerDriftError(
        `Tracker header drift: expected [${expected}] found [${firstLine}]`,
      );
    }
  }

  async appendRow(meta: RecordMetadata): Promise<void> {
    await this.validateHeaders();
    // Simulated lock: a desktop Excel session holds the workbook
    if (Math.random() < Number(process.env.MOCK_TRACKER_LOCK_RATE ?? 0.05)) {
      throw new TrackerLockedError("The tracker workbook is open in Excel (simulated lock).");
    }
    await appendFile(this.file, rowFor(meta) + "\n");
  }
}

export class TrackerDriftError extends Error {}
export class TrackerLockedError extends Error {}

const appender = new MockTrackerAppender();

/** Queue an append for a filed record and attempt it immediately. On
 *  failure the queue row stays pending for retry. */
export async function queueTrackerAppend(itemId: string, occurrence: string): Promise<void> {
  await db.trackerQueue.create({ data: { itemId, occurrence } });
  await processTrackerQueue();
}

/** Work the queue oldest-first. Rows are rebuilt from storage metadata at
 *  append time; nothing waits in the database but pointers. */
export async function processTrackerQueue(): Promise<{ appended: number; pending: number }> {
  const pending = await db.trackerQueue.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });
  let appended = 0;
  for (const row of pending) {
    try {
      const record = await getStorageAdapter().getRecord(row.itemId);
      if (!record) throw new Error("Record no longer resolvable");
      await appender.appendRow(record.metadata);
      await db.trackerQueue.update({
        where: { id: row.id },
        data: { status: "appended", attempts: { increment: 1 }, lastError: null },
      });
      appended++;
    } catch (err) {
      const isDrift = err instanceof TrackerDriftError;
      await db.trackerQueue.update({
        where: { id: row.id },
        data: {
          attempts: { increment: 1 },
          lastError: err instanceof Error ? err.message : String(err),
        },
      });
      if (isDrift) {
        await appendAudit({
          actorOid: "system",
          action: "tracker-drift-alert",
          detail: { occurrence: row.occurrence },
        });
        break; // Drift affects every append — stop and alert, do not spin
      }
    }
  }
  const remaining = await db.trackerQueue.count({ where: { status: "pending" } });
  return { appended, pending: remaining };
}
