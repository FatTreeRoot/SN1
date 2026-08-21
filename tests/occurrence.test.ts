import { describe, expect, it } from "vitest";
import { nextOccurrenceNumber } from "@/lib/occurrence/generate";
import { issueBlock, ownsPreIssued } from "@/lib/occurrence/blocks";

describe("occurrence numbers", () => {
  it("never duplicates under a concurrent burst", async () => {
    const forDate = new Date("2031-01-15T12:00:00");
    const numbers = await Promise.all(
      Array.from({ length: 25 }, () => nextOccurrenceNumber(forDate)),
    );
    expect(new Set(numbers).size).toBe(25);
    for (const n of numbers) expect(n).toMatch(/^PS-2031-0115-\d{4}$/);
  });

  it("pre-issued blocks never collide with live generation", async () => {
    const forDate = new Date("2031-02-01T12:00:00");
    const before = await nextOccurrenceNumber(forDate);
    const block = await issueBlock({ oid: "test-user", count: 5, forDate });
    const after = await nextOccurrenceNumber(forDate);
    const all = [before, ...block.numbers, after];
    expect(new Set(all).size).toBe(all.length);
  });

  it("only the issued user owns a pre-issued number", async () => {
    const forDate = new Date("2031-03-01T12:00:00");
    const block = await issueBlock({ oid: "owner-user", count: 2, forDate });
    expect(await ownsPreIssued("owner-user", block.numbers[0])).toBe(true);
    expect(await ownsPreIssued("someone-else", block.numbers[0])).toBe(false);
  });
});
