import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { fileRecord, FilingError } from "@/lib/filing";
import { getStorageAdapter } from "@/lib/storage";
import type { Sensitivity } from "@/lib/storage";

/**
 * Corrections supersede — nothing is edited in place or deleted, ever.
 * The new version links back through the occurrence number; the earlier
 * version is marked Superseded in a metadata-only change.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser("reviewQueue");
  if (error) return error;

  const form = await request.formData();
  const originalItemId = String(form.get("originalItemId") ?? "");
  const idempotencyKey = String(form.get("idempotencyKey") ?? "");
  const note = form.get("note") ? String(form.get("note")) : undefined;
  const file = form.get("file");
  const recordTypeId = form.get("recordTypeId") ? String(form.get("recordTypeId")) : undefined;
  const categoryId = form.get("categoryId") ? String(form.get("categoryId")) : undefined;
  const locationId = form.get("locationId") ? String(form.get("locationId")) : undefined;
  const sensitivity = form.get("sensitivity")
    ? (String(form.get("sensitivity")) as Sensitivity)
    : undefined;

  if (!originalItemId || !idempotencyKey) {
    return NextResponse.json(
      { error: "The original item and an idempotency key are required." },
      { status: 400 },
    );
  }

  const adapter = getStorageAdapter();
  const original = await adapter.getRecord(originalItemId);
  if (!original) {
    return NextResponse.json({ error: "That record was not found." }, { status: 404 });
  }

  let content: { buffer: Buffer; contentType: string };
  if (file instanceof File && file.size > 0) {
    content = {
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || "application/octet-stream",
    };
  } else if (note) {
    content = { buffer: Buffer.from(note, "utf8"), contentType: "text/plain" };
  } else {
    // Metadata-only correction re-files the original content under the
    // corrected metadata
    content = { buffer: original.content, contentType: original.contentType };
  }

  try {
    const result = await fileRecord({
      user,
      recordTypeId: recordTypeId ?? original.metadata.recordTypeId,
      categoryId: categoryId ?? (original.metadata.categoryId === "NA" ? undefined : original.metadata.categoryId),
      locationId: locationId ?? (original.metadata.locationId === "NA" ? undefined : original.metadata.locationId),
      recordDate: original.metadata.recordDate,
      capturedAt: new Date().toISOString(),
      idempotencyKey,
      sensitivity,
      supersedes: original.metadata.occurrenceNumber,
      areaId: original.metadata.areaId,
      content,
      author: { oid: original.metadata.authorOid, name: original.metadata.authorName },
    });

    await adapter.markSuperseded(originalItemId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FilingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "The correction did not file. Try again." },
      { status: 503 },
    );
  }
}
