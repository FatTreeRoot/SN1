import { getStorageAdapter } from "@/lib/storage";
import { getAdminSetting } from "@/lib/settings";
import { suppressBreakdown, type SuppressedBreakdown } from "./suppress";

/**
 * Quarterly aggregation: query SharePoint metadata, aggregate in memory,
 * render, discard. Narrative content never enters this path — the inputs
 * are metadata rows only, and superseded versions are excluded so
 * corrections do not double-count.
 */

export type QuarterReport = {
  quarter: string;
  from: string;
  to: string;
  generatedAt: string;
  threshold: number;
  totalRecords: number;
  byType: SuppressedBreakdown;
  byCategory: SuppressedBreakdown;
  byArea: SuppressedBreakdown;
  byMonth: { label: string; value: number }[];
  locationsByArea: { area: string; breakdown: SuppressedBreakdown }[];
  suppressionApplied: boolean;
};

export function quarterRange(quarter: string): { from: string; to: string } {
  const m = quarter.match(/^(\d{4})-Q([1-4])$/);
  if (!m) throw new Error("Quarter must look like 2026-Q3.");
  const year = Number(m[1]);
  const q = Number(m[2]);
  const from = `${year}-${String((q - 1) * 3 + 1).padStart(2, "0")}-01`;
  const endMonth = q * 3;
  const lastDay = new Date(year, endMonth, 0).getDate();
  const to = `${year}-${String(endMonth).padStart(2, "0")}-${lastDay}`;
  return { from, to };
}

function countBy<T>(rows: T[], key: (row: T) => string): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export async function buildQuarterReport(quarter: string): Promise<QuarterReport> {
  const { from, to } = quarterRange(quarter);
  const threshold = await getAdminSetting("suppressionThreshold");

  const all = await getStorageAdapter().listByDateRange({ from, to });
  // Corrections supersede; only current versions count, and the report
  // record type itself never reports on reports.
  const rows = all.filter((r) => r.status === "Filed" && r.recordTypeId !== "RT-QRP");

  const byType = suppressBreakdown(countBy(rows, (r) => r.recordTypeName), threshold);
  const byCategory = suppressBreakdown(
    countBy(rows.filter((r) => r.categoryId !== "NA"), (r) => r.categoryName),
    threshold,
  );
  const byArea = suppressBreakdown(countBy(rows, (r) => r.areaName), threshold);

  const months = countBy(rows, (r) => r.recordDate.slice(0, 7)).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  const areas = [...new Set(rows.map((r) => r.areaName))].sort();
  const locationsByArea = areas.map((area) => ({
    area,
    breakdown: suppressBreakdown(
      countBy(
        rows.filter((r) => r.areaName === area && r.locationId !== "NA"),
        (r) => r.locationName,
      ),
      threshold,
      `Locations in ${area} (small counts combined)`,
    ),
  }));

  return {
    quarter,
    from,
    to,
    generatedAt: new Date().toISOString(),
    threshold,
    totalRecords: rows.length,
    byType,
    byCategory,
    byArea,
    byMonth: months,
    locationsByArea,
    suppressionApplied:
      byType.suppressionApplied ||
      byCategory.suppressionApplied ||
      byArea.suppressionApplied ||
      locationsByArea.some((l) => l.breakdown.suppressionApplied),
  };
}
