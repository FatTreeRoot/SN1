import { db } from "@/lib/db";

/**
 * Occurrence numbers: PS-YYYY-MMDD-NNNN, allocated atomically in the
 * database — never from SharePoint item ids, which race under concurrent
 * writes. Allocation is a single native upsert (INSERT … ON CONFLICT …
 * RETURNING), atomic on both SQLite and Postgres; a rare create/create
 * race retries.
 */

export function dateKeyFor(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}${d}`;
}

export function formatOccurrence(dateKey: string, seq: number): string {
  return `PS-${dateKey}-${String(seq).padStart(4, "0")}`;
}

/** Atomically claim `count` sequence numbers for a date; returns the first. */
export async function claimSequence(dateKey: string, count: number): Promise<number> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const row = await db.occurrenceSequence.upsert({
        where: { dateKey },
        create: { dateKey, nextSeq: 1 + count },
        update: { nextSeq: { increment: count } },
      });
      return row.nextSeq - count;
    } catch (err) {
      lastError = err; // unique-constraint race on first create: retry
    }
  }
  throw lastError;
}

/** Allocate the next number for the given date. */
export async function nextOccurrenceNumber(forDate = new Date()): Promise<string> {
  const dateKey = dateKeyFor(forDate);
  const seq = await claimSequence(dateKey, 1);
  return formatOccurrence(dateKey, seq);
}
