import { describe, expect, it } from "vitest";
import { canConvertToPdf, imageToPdf } from "@/lib/notebook";

/** A 1x1 PNG — enough to prove the conversion path produces a real PDF. */
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("notebook scans", () => {
  it("converts a photographed page to a PDF", async () => {
    const pdf = await imageToPdf(PNG_1PX);
    // PDFs begin with %PDF- and end with the EOF marker
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1")).toContain("%%EOF");
  });

  it("recognises which camera formats can convert", () => {
    expect(canConvertToPdf("image/jpeg")).toBe(true);
    expect(canConvertToPdf("image/png")).toBe(true);
    // HEIC and anything unexpected file as-is rather than failing the submission
    expect(canConvertToPdf("image/heic")).toBe(false);
  });
});
