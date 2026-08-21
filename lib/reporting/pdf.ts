import PDFDocument from "pdfkit";
import { identity, palette } from "@/config/branding";
import type { QuarterReport } from "./aggregate";
import type { SuppressedBreakdown } from "./suppress";

/**
 * The Council PDF: calm, institutional, and explicit about suppression.
 * Colours resolve from config/branding.ts; the logo block is the BrandMark
 * placeholder until the Nation supplies assets (docs/BRANDING.md).
 * Built entirely in memory and handed back as a buffer — nothing touches
 * disk on the way through.
 */
export function renderQuarterPdf(report: QuarterReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 54 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const ink = palette.charcoal;
    const muted = palette.gray600;
    const accent = palette.red600; // the Nation's cedar red leads the brand chrome

    // Header with brand placeholder
    doc.rect(54, 50, 90, 30).dash(2, { space: 2 }).stroke(palette.gray400).undash();
    doc.fontSize(6).fillColor(muted).text(`${identity.nation} logo`, 54, 62, {
      width: 90,
      align: "center",
    });
    doc
      .fontSize(16)
      .fillColor(ink)
      .font("Helvetica-Bold")
      .text(`${identity.department} — Quarterly report`, 160, 52);
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(muted)
      .text(`${report.quarter} · ${report.from} to ${report.to}`, 160, 74);
    doc.moveTo(54, 96).lineTo(558, 96).lineWidth(1.5).stroke(accent);
    doc.y = 112;

    doc
      .fontSize(11)
      .fillColor(ink)
      .font("Helvetica")
      .text(
        `${report.totalRecords} records this quarter. Generated ${new Date(
          report.generatedAt,
        ).toLocaleDateString()} from record metadata only.`,
        54,
      );
    doc.moveDown(1);

    const section = (title: string, b: SuppressedBreakdown) => {
      if (doc.y > 640) doc.addPage();
      doc.fontSize(13).font("Helvetica-Bold").fillColor(ink).text(title, 54);
      doc.moveDown(0.4);
      const rows = [...b.cells, ...(b.rollupCell ? [b.rollupCell] : [])];
      for (const cell of rows) {
        const y = doc.y;
        doc.fontSize(10).font("Helvetica").fillColor(cell.suppressed ? muted : ink);
        doc.text(cell.label, 66, y, { width: 330 });
        doc.text(cell.value === null ? "withheld ‡" : `${cell.value}${cell.suppressed ? " ‡" : ""}`, 400, y, {
          width: 100,
          align: "right",
        });
        doc.moveDown(0.25);
      }
      if (rows.length === 0) {
        doc.fontSize(10).fillColor(muted).text("No records.", 66);
      }
      doc.moveDown(0.8);
    };

    section("By record type", report.byType);
    section("By category", report.byCategory);
    section("By area", report.byArea);
    for (const l of report.locationsByArea) {
      section(`Locations — ${l.area}`, l.breakdown);
    }

    if (doc.y > 660) doc.addPage();
    doc.fontSize(13).font("Helvetica-Bold").fillColor(ink).text("By month", 54);
    doc.moveDown(0.4);
    for (const m of report.byMonth) {
      const y = doc.y;
      doc.fontSize(10).font("Helvetica").fillColor(ink);
      doc.text(m.label, 66, y, { width: 330 });
      doc.text(String(m.value), 400, y, { width: 100, align: "right" });
      doc.moveDown(0.25);
    }

    // Suppression footnote — always present when anything was withheld
    if (report.suppressionApplied) {
      doc.moveDown(1.2);
      doc
        .fontSize(9)
        .fillColor(muted)
        .text(
          `‡ Values below the suppression threshold (${report.threshold}) are combined or withheld to protect ` +
            `privacy in a small community. A withheld value is not zero.`,
          54,
          undefined,
          { width: 504 },
        );
    }

    doc.end();
  });
}
