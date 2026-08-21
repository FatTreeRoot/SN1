import { NextRequest, NextResponse } from "next/server";
import { appendAudit } from "@/lib/auth/audit";
import { requireUser } from "@/lib/auth/guard";
import { getStorageAdapter } from "@/lib/storage";

/**
 * Full record view: the only path that returns narrative content, Desk-only
 * via the viewNarrative capability. Reads are audited (who, when, which
 * item — never what it says).
 */
export async function GET(request: NextRequest) {
  const { user, error } = await requireUser("viewNarrative");
  if (error) return error;

  const itemId = request.nextUrl.searchParams.get("item");
  if (!itemId) return NextResponse.json({ error: "item is required." }, { status: 400 });

  const adapter = getStorageAdapter();
  const record = await adapter.getRecord(itemId);
  if (!record) {
    return NextResponse.json({ error: "That record was not found." }, { status: 404 });
  }

  await appendAudit({
    actorOid: user.oid,
    action: "read",
    surface: user.surface,
    recordType: record.metadata.recordTypeCode,
    itemId,
  });

  const versions = await adapter.findByOccurrence(
    record.metadata.supersedes ?? record.metadata.occurrenceNumber,
  );

  const isText =
    record.contentType.startsWith("text/") || record.contentType === "application/json";
  return NextResponse.json({
    metadata: record.metadata,
    contentType: record.contentType,
    content: isText ? record.content.toString("utf8") : null,
    contentBase64: isText ? null : record.content.toString("base64"),
    versions: versions.map((v) => ({
      itemId: v.itemId,
      occurrenceNumber: v.occurrenceNumber,
      status: v.status,
      syncedAt: v.syncedAt,
      supersedes: v.supersedes,
    })),
  });
}
