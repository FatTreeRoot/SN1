import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { fileRecord, FilingError } from "@/lib/filing";
import { devUsers } from "@/config/dev-users";

/**
 * Reconciliation: a supervisor files from Field Capture Cards after an
 * outage, on behalf of the member who wrote them, with the paper's
 * pre-issued occurrence number honoured when present.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireUser("submitOnBehalf");
  if (error) return error;

  const body = (await request.json()) as {
    authorOid?: string;
    recordTypeId?: string;
    categoryId?: string;
    locationId?: string;
    recordDate?: string;
    capturedAt?: string;
    narrative?: string;
    tempRef?: string;
    preIssuedOccurrence?: string;
    idempotencyKey?: string;
  };

  if (!body.recordTypeId || !body.narrative || !body.idempotencyKey) {
    return NextResponse.json(
      { error: "Record type, narrative, and idempotency key are required." },
      { status: 400 },
    );
  }

  // Author resolution comes from the directory in production; dev users here
  const author = devUsers.find((u) => u.oid === body.authorOid);
  if (!author) {
    return NextResponse.json({ error: "Choose the member who wrote the card." }, { status: 400 });
  }

  const content = [
    body.tempRef ? `Temporary reference: ${body.tempRef}` : null,
    `Transcribed from Field Capture Card by ${user.displayName}`,
    "",
    body.narrative,
  ]
    .filter((l) => l !== null)
    .join("\n");

  try {
    const result = await fileRecord({
      user,
      recordTypeId: body.recordTypeId,
      categoryId: body.categoryId,
      locationId: body.locationId,
      recordDate: body.recordDate,
      capturedAt: body.capturedAt ?? new Date().toISOString(),
      idempotencyKey: body.idempotencyKey,
      preIssuedOccurrence: body.preIssuedOccurrence || undefined,
      author: { oid: author.oid, name: author.displayName },
      content: { buffer: Buffer.from(content, "utf8"), contentType: "text/plain" },
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FilingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "That card did not file. Try again." }, { status: 503 });
  }
}
