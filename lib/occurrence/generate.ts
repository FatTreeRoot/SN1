import { db } from "@/lib/db";

/**
 * Occurrence numbers: PS-YYYY-MMDD-NNNN, generated in a database
 * transaction — never from SharePoint item ids, which race under concurrent
 * writes. Block pre-issue for paper capture arrives at checkpoint 8.
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

/** Allocate the next number for the given date, atomically. */
export async function nextOccurrenceNumber(forDate = new Date()): Promise<string> {
  const dateKey = dateKeyFor(forDate);
  const seq = await db.$transaction(async (tx) => {
    const row = await tx.occurrenceSequence.upsert({
      where: { dateKey },
      create: { dateKey, nextSeq: 2 },
      update: { nextSeq: { increment: 1 } },
    });
    // upsert returns the post-update row; on create nextSeq=2 means we
    // allocated 1, on update we allocated the pre-increment value.
    return row.nextSeq - 1;
  });
  return formatOccurrence(dateKey, seq);
}
