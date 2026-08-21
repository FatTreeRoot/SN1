import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { identity, palette } from "@/config/branding";
import { requireUser } from "@/lib/auth/guard";
import { getVocabularies } from "@/lib/vocab";

/**
 * The printable Field Capture Card: field order matches the submit flow
 * exactly, so transcription from paper is mechanical rather than judgement.
 */
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const vocab = getVocabularies();
  const pdf = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const ink = palette.charcoal;
    const muted = palette.gray600;

    // Two cards per letter page
    for (const top of [40, 416]) {
      doc.rect(40, top, 532, 356).lineWidth(1).stroke(muted);
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(ink)
        .text(`${identity.appName} — Field Capture Card`, 52, top + 10);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(muted)
        .text("Same order as the app. One occurrence per card.", 52, top + 26);

      const line = (label: string, y: number, width = 250) => {
        doc.fontSize(8).fillColor(muted).text(label, 52, y);
        doc
          .moveTo(52, y + 20)
          .lineTo(52 + width, y + 20)
          .lineWidth(0.75)
          .stroke(muted);
      };

      // Field order mirrors SubmitFlow: type → category → capture → date → location
      const types = vocab.recordTypes
        .filter((rt) => rt.enabled && rt.surface.includes("field"))
        .map((rt) => rt.name)
        .join("   ○ ");
      doc.fontSize(8).fillColor(muted).text("Record type (circle one)", 52, top + 44);
      doc.fontSize(9).fillColor(ink).text(`○ ${types}`, 52, top + 56, { width: 508 });

      doc.fontSize(8).fillColor(muted).text("Category (circle one)", 52, top + 76);
      const cats = vocab.categories.map((c) => c.name).join("   ○ ");
      doc.fontSize(9).fillColor(ink).text(`○ ${cats}`, 52, top + 88, { width: 508 });

      line("Occurrence number (from your pre-issued block)", top + 122, 220);
      doc.fontSize(8).fillColor(muted).text("Temporary reference (if no number)", 320, top + 122);
      doc.moveTo(320, top + 142).lineTo(540, top + 142).stroke(muted);

      line("Date it happened", top + 154, 150);
      doc.fontSize(8).fillColor(muted).text("Location", 250, top + 154);
      doc.moveTo(250, top + 174).lineTo(540, top + 174).stroke(muted);

      doc.fontSize(8).fillColor(muted).text("What happened, in your words", 52, top + 188);
      for (let i = 0; i < 6; i++) {
        const y = top + 208 + i * 20;
        doc.moveTo(52, y).lineTo(540, y).lineWidth(0.5).stroke(muted);
      }

      line("Member (print name)", top + 332, 200);
      doc.fontSize(8).fillColor(muted).text("Time captured", 300, top + 332);
      doc.moveTo(300, top + 352).lineTo(430, top + 352).stroke(muted);
    }

    doc.end();
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="field-capture-card.pdf"',
    },
  });
}
