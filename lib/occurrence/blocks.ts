import { db } from "@/lib/db";
import { claimSequence, dateKeyFor, formatOccurrence } from "./generate";

/**
 * Block pre-issue: a patroller receives a block of occurrence numbers at
 * shift sign-on so the number can go on the paper page at the scene,
 * before filing. Issued in the same transaction space as normal
 * generation, so blocks and live numbers never collide.
 */
export async function issueBlock(input: {
  oid: string;
  count?: number;
  forDate?: Date;
}): Promise<{ numbers: string[]; dateKey: string }> {
  const count = Math.min(Math.max(input.count ?? 5, 1), 20);
  const dateKey = dateKeyFor(input.forDate ?? new Date());

  const startSeq = await claimSequence(dateKey, count);

  await db.occurrenceBlock.create({
    data: { dateKey, startSeq, endSeq: startSeq + count - 1, issuedTo: input.oid },
  });

  return {
    numbers: Array.from({ length: count }, (_, i) => formatOccurrence(dateKey, startSeq + i)),
    dateKey,
  };
}

/** True when the number belongs to a block issued to this user. */
export async function ownsPreIssued(oid: string, occurrence: string): Promise<boolean> {
  const match = occurrence.match(/^PS-(\d{4}-\d{4})-(\d{4})$/);
  if (!match) return false;
  const [, dateKey, seqStr] = match;
  const seq = Number(seqStr);
  const block = await db.occurrenceBlock.findFirst({
    where: { issuedTo: oid, dateKey, startSeq: { lte: seq }, endSeq: { gte: seq } },
  });
  return Boolean(block);
}

/** Blocks issued to a user for today, for showing on the Field home. */
export async function activeBlocks(oid: string): Promise<string[]> {
  const dateKey = dateKeyFor(new Date());
  const blocks = await db.occurrenceBlock.findMany({
    where: { issuedTo: oid, dateKey },
    orderBy: { issuedAt: "asc" },
  });
  return blocks.flatMap((b) =>
    Array.from({ length: b.endSeq - b.startSeq + 1 }, (_, i) =>
      formatOccurrence(b.dateKey, b.startSeq + i),
    ),
  );
}
