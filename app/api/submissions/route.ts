import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { fileRecord, FilingError } from "@/lib/filing";
import { canEmbed, renderPagesPdf, renderReportPdf, type ReportPhoto } from "@/lib/report-pdf";
import { getActiveShift } from "@/lib/shift";
import { getStorageAdapter } from "@/lib/storage";
import type { Sensitivity } from "@/lib/storage";

/**
 * Submission intake. Content arrives as multipart form data and streams
 * through to the storage adapter — request bodies are held in memory only,
 * never written to disk on this server, never logged.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser("submit");
  if (error) return error;

  const maxBytes = Number(process.env.MAX_UPLOAD_MB ?? 25) * 1024 * 1024;
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > maxBytes) {
    return NextResponse.json(
      { error: "That file is too large to file from a phone. Use the Desk surface." },
      { status: 413 },
    );
  }

  const form = await request.formData();
  const recordTypeId = String(form.get("recordTypeId") ?? "");
  const categoryId = form.get("categoryId") ? String(form.get("categoryId")) : undefined;
  const locationId = form.get("locationId") ? String(form.get("locationId")) : undefined;
  const recordDate = form.get("recordDate") ? String(form.get("recordDate")) : undefined;
  const capturedAt = String(form.get("capturedAt") ?? new Date().toISOString());
  const idempotencyKey = String(form.get("idempotencyKey") ?? "");
  const sensitivity = form.get("sensitivity")
    ? (String(form.get("sensitivity")) as Sensitivity)
    : undefined;
  const preIssuedOccurrence = form.get("preIssuedOccurrence")
    ? String(form.get("preIssuedOccurrence"))
    : undefined;

  if (!idempotencyKey || idempotencyKey.length < 16) {
    return NextResponse.json(
      { error: "A client idempotency key is required." },
      { status: 400 },
    );
  }

  // Inputs: up to five photos, a written/dictated narrative, and (for
  // document filing) a generic attachment. Free text and photos never land
  // anywhere but the composed document in storage.
  const note = form.get("note") ? String(form.get("note")) : undefined;
  const attachment = form.get("file");

  const photoParts = form
    .getAll("photo")
    .filter((p): p is File => p instanceof File && p.size > 0);
  if (photoParts.length > 5) {
    return NextResponse.json({ error: "Five photos at most per report." }, { status: 400 });
  }
  const badPhoto = photoParts.find((p) => !canEmbed(p.type));
  if (badPhoto) {
    return NextResponse.json(
      { error: "Use JPEG or PNG photos — that format cannot go into the report." },
      { status: 400 },
    );
  }
  const photos: ReportPhoto[] = await Promise.all(
    photoParts.map(async (p) => ({
      buffer: Buffer.from(await p.arrayBuffer()),
      contentType: p.type,
    })),
  );

  let content: Parameters<typeof fileRecord>[0]["content"];
  if (recordTypeId === "RT-NBS") {
    // Notebook scans: photographed pages become one PDF, a page per photo
    const pages =
      photos.length > 0
        ? photos
        : attachment instanceof File && attachment.size > 0 && canEmbed(attachment.type)
          ? [
              {
                buffer: Buffer.from(await attachment.arrayBuffer()),
                contentType: attachment.type,
              },
            ]
          : [];
    if (pages.length === 0) {
      return NextResponse.json(
        { error: "Photograph at least one page, then file it." },
        { status: 400 },
      );
    }
    content = async (meta) => ({
      buffer: await renderPagesPdf(pages, meta.occurrenceNumber),
      contentType: "application/pdf",
    });
  } else if (photos.length > 0 || note) {
    // The report: a formatted PDF composed from narrative and photos,
    // carrying the occurrence number the moment it exists
    content = async (meta) => ({
      buffer: await renderReportPdf({ meta, narrative: note, photos }),
      contentType: "application/pdf",
    });
  } else if (attachment instanceof File && attachment.size > 0) {
    // Document filing (Desk bulk path): the file goes as itself
    content = {
      buffer: Buffer.from(await attachment.arrayBuffer()),
      contentType: attachment.type || "application/octet-stream",
    };
  } else {
    return NextResponse.json(
      { error: "Add a photo or a note, then file it." },
      { status: 400 },
    );
  }

  const shift = await getActiveShift(user.oid);

  try {
    const result = await fileRecord({
      user,
      recordTypeId,
      categoryId,
      locationId,
      recordDate,
      capturedAt,
      idempotencyKey,
      sensitivity,
      preIssuedOccurrence,
      content,
      shift: shift
        ? {
            id: shift.id,
            vehicleId: shift.vehicleId,
            vehicleName: shift.vehicleName,
            areaId: shift.areaId,
            areaName: shift.areaName,
          }
        : null,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FilingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    // Storage failure: the client keeps the item queued and retries
    return NextResponse.json(
      { error: "The server did not confirm. Keep the app open — it will retry." },
      { status: 503 },
    );
  }
}

/** My submissions: last 30 days, metadata only, read live on each load —
 *  never cached on the device. */
export async function GET() {
  const { user, error } = await requireUser("viewOwn");
  if (error) return error;
  const items = await getStorageAdapter().listRecentByUser(user.oid, 30);
  return NextResponse.json({ items });
}
