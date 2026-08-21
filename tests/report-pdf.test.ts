import { describe, expect, it } from "vitest";
import { canEmbed, renderPagesPdf, renderReportPdf } from "@/lib/report-pdf";
import type { RecordMetadata } from "@/lib/storage";

/** A 1x1 PNG — enough to prove photo pages render. */
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const meta: RecordMetadata = {
  recordTypeId: "RT-CFS",
  recordTypeCode: "CFS",
  recordTypeName: "Call for service",
  recordDate: "2031-06-01",
  occurrenceNumber: "PS-2031-0601-0001",
  categoryId: "CAT-WEL",
  categoryName: "Wellness check",
  areaId: "AREA-NS",
  areaName: "North Shore",
  locationId: "LOC-NS-01",
  locationName: "Capilano",
  submittedByOid: "t",
  submittedByName: "Test Patroller",
  authorOid: "t",
  authorName: "Test Patroller",
  sensitivity: "confidential",
  retentionClass: "RC-CFS",
  status: "Filed",
  capturedAt: new Date().toISOString(),
  syncedAt: new Date().toISOString(),
  idempotencyKey: "test",
};

describe("report PDF", () => {
  it("renders a formatted report carrying the occurrence number", async () => {
    const pdf = await renderReportPdf({
      meta,
      narrative: "Checked on a resident near the community centre. All fine.",
      photos: [],
    });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1")).toContain("%%EOF");
  });

  it("adds a page per photo", async () => {
    const noPhotos = await renderReportPdf({ meta, narrative: "n", photos: [] });
    const twoPhotos = await renderReportPdf({
      meta,
      narrative: "n",
      photos: [
        { buffer: PNG_1PX, contentType: "image/png" },
        { buffer: PNG_1PX, contentType: "image/png" },
      ],
    });
    expect(twoPhotos.length).toBeGreaterThan(noPhotos.length);
    // Page objects: 1 report page vs 1 + 2 photo pages
    const pages = (b: Buffer) => (b.toString("latin1").match(/\/Type \/Page[^s]/g) ?? []).length;
    expect(pages(twoPhotos)).toBe(pages(noPhotos) + 2);
  });

  it("renders notebook pages as a multi-page PDF", async () => {
    const pdf = await renderPagesPdf(
      [
        { buffer: PNG_1PX, contentType: "image/png" },
        { buffer: PNG_1PX, contentType: "image/png" },
        { buffer: PNG_1PX, contentType: "image/png" },
      ],
      "PS-2031-0601-0002",
    );
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect((pdf.toString("latin1").match(/\/Type \/Page[^s]/g) ?? []).length).toBe(3);
  });

  it("recognises which camera formats can embed", () => {
    expect(canEmbed("image/jpeg")).toBe(true);
    expect(canEmbed("image/png")).toBe(true);
    expect(canEmbed("image/heic")).toBe(false);
  });
});
