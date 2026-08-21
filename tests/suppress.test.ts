import { describe, expect, it } from "vitest";
import { suppressBreakdown } from "@/lib/reporting/suppress";

describe("small-cell suppression", () => {
  it("publishes counts at or above the threshold and true zeros", () => {
    const r = suppressBreakdown(
      [
        { label: "Wellness check", value: 12 },
        { label: "Noise complaint", value: 5 },
        { label: "Trespass", value: 0 },
      ],
      5,
    );
    expect(r.suppressionApplied).toBe(false);
    expect(r.cells).toHaveLength(3);
    expect(r.rollupCell).toBeNull();
  });

  it("rolls small cells into a publishable aggregate when safe", () => {
    const r = suppressBreakdown(
      [
        { label: "A", value: 9 },
        { label: "B", value: 3 },
        { label: "C", value: 4 },
      ],
      5,
    );
    expect(r.suppressionApplied).toBe(true);
    expect(r.cells.map((c) => c.label)).toEqual(["A"]);
    expect(r.rollupCell).toMatchObject({ value: 7, suppressed: true });
  });

  it("withholds a single small cell — subtraction must not recover it", () => {
    const r = suppressBreakdown(
      [
        { label: "A", value: 20 },
        { label: "B", value: 2 },
      ],
      5,
    );
    expect(r.rollupCell).toMatchObject({ value: null, suppressed: true });
  });

  it("withholds an aggregate that is still below the threshold", () => {
    const r = suppressBreakdown(
      [
        { label: "A", value: 1 },
        { label: "B", value: 2 },
      ],
      5,
    );
    expect(r.rollupCell).toMatchObject({ value: null, suppressed: true });
    expect(r.cells).toHaveLength(0);
  });

  it("a withheld value is visibly suppressed, never rendered as zero", () => {
    const r = suppressBreakdown([{ label: "Only", value: 3 }], 5);
    expect(r.rollupCell?.value).toBeNull();
    expect(r.rollupCell?.suppressed).toBe(true);
  });
});
