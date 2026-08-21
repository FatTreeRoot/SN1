import PDFDocument from "pdfkit";

/**
 * Notebook scans: a photographed notebook page becomes a letter-size PDF
 * before filing, so the restricted library holds documents rather than
 * loose camera files. Conversion happens in memory; the photo is never
 * written to disk on the way through.
 *
 * pdfkit embeds JPEG and PNG. Anything else (rare — the camera capture
 * path yields JPEG) files in its original format rather than failing.
 */
export function canConvertToPdf(contentType: string): boolean {
  return contentType === "image/jpeg" || contentType === "image/png";
}

export function imageToPdf(image: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    // Letter page 612x792pt; fit inside the margins
    doc.image(image, 36, 36, { fit: [540, 720], align: "center", valign: "center" });
    doc.end();
  });
}
