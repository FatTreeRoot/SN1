/**
 * Small-cell suppression — enforced in code, not left to practice.
 *
 * This department serves a community where a count of two incidents in a
 * named location is potentially identifying. Below the threshold a count
 * rolls up to the next geographic level; where roll-up cannot protect it,
 * the value is withheld and the output says so, so a reader knows a value
 * was suppressed rather than zero.
 */

export type Cell = {
  label: string;
  /** The published value; null when withheld. */
  value: number | null;
  suppressed: boolean;
};

export type SuppressedBreakdown = {
  cells: Cell[];
  /** Count of small cells rolled into the aggregate line, if any. */
  rolledUp: number;
  /** The aggregate line for rolled-up cells, when it can be published. */
  rollupCell: Cell | null;
  suppressionApplied: boolean;
};

/**
 * Suppress a categorical breakdown. Cells at or above the threshold
 * publish as-is; zero cells publish as zero (absence is not identifying);
 * small cells (0 < n < threshold) roll into one aggregate line. If the
 * aggregate itself is still small, it is withheld entirely.
 */
export function suppressBreakdown(
  counts: { label: string; value: number }[],
  threshold: number,
  rollupLabel = "Other (small counts combined)",
): SuppressedBreakdown {
  const cells: Cell[] = [];
  const small: { label: string; value: number }[] = [];

  for (const c of counts) {
    if (c.value === 0 || c.value >= threshold) {
      cells.push({ label: c.label, value: c.value, suppressed: false });
    } else {
      small.push(c);
    }
  }

  let rollupCell: Cell | null = null;
  if (small.length > 0) {
    const total = small.reduce((s, c) => s + c.value, 0);
    // One small cell rolled alone, or a still-small total, would be
    // recoverable by subtraction or remain identifying: withhold the value.
    if (small.length >= 2 && total >= threshold) {
      rollupCell = { label: rollupLabel, value: total, suppressed: true };
    } else {
      rollupCell = { label: rollupLabel, value: null, suppressed: true };
    }
  }

  return {
    cells,
    rolledUp: small.length,
    rollupCell,
    suppressionApplied: small.length > 0,
  };
}
