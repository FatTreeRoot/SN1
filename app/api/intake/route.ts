import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/capabilities";
import { fileRecord, FilingError } from "@/lib/filing";

/**
 * Automated intake. The call-centre pipeline runs inside the client's
 * tenant (Power Automate) and calls this endpoint; it authenticates with a
 * service key, or a signed-in PS-CallCentre session may submit manually.
 * Intake writes only — the call-centre role has no read access anywhere.
 */
export async function POST(request: NextRequest) {
  const serviceKey = process.env.INTAKE_API_KEY;
  const presentedKey = request.headers.get("x-intake-key");
  let actor = null;

  if (serviceKey && presentedKey === serviceKey) {
    actor = {
      oid: "svc-intake",
      displayName: "Call centre intake",
      email: "intake@system",
      roles: ["PS-CallCentre" as const],
      sessionId: "service",
      surface: "desk" as const,
    };
  } else {
    const user = await getCurrentUser();
    if (user && can(user.roles, user.surface, "submitIntake")) actor = user;
  }
  if (!actor) {
    return NextResponse.json({ error: "Intake requires authorisation." }, { status: 401 });
  }

  const body = (await request.json()) as {
    subject?: string;
    receivedAt?: string;
    content?: string;
    areaId?: string;
  };
  if (!body.content) {
    return NextResponse.json({ error: "Intake content is required." }, { status: 400 });
  }

  try {
    const result = await fileRecord({
      user: actor,
      recordTypeId: "RT-CCI",
      capturedAt: body.receivedAt ?? new Date().toISOString(),
      idempotencyKey: randomUUID(),
      areaId: body.areaId ?? "AREA-OT",
      content: {
        buffer: Buffer.from(
          JSON.stringify(
            { subject: body.subject ?? "", receivedAt: body.receivedAt, content: body.content },
            null,
            2,
          ),
        ),
        contentType: "application/json",
      },
    });
    return NextResponse.json({ occurrenceNumber: result.occurrenceNumber });
  } catch (err) {
    if (err instanceof FilingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Intake failed; retry with backoff." }, { status: 503 });
  }
}
