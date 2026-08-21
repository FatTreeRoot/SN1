import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { fileRecord, FilingError } from "@/lib/filing";
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

  if (!idempotencyKey || idempotencyKey.length < 16) {
    return NextResponse.json(
      { error: "A client idempotency key is required." },
      { status: 400 },
    );
  }

  // Content: either an attached/captured file or a typed note (which
  // becomes a text file in storage — free text never lands in the database)
  const file = form.get("file");
  const note = form.get("note") ? String(form.get("note")) : undefined;
  let content: { buffer: Buffer; contentType: string };
  if (file instanceof File && file.size > 0) {
    content = {
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || "application/octet-stream",
    };
  } else if (note) {
    content = { buffer: Buffer.from(note, "utf8"), contentType: "text/plain" };
  } else {
    return NextResponse.json(
      { error: "Attach a photo or file, or add a note, then file it." },
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
