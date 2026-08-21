import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { listOwnSessions, revokeSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/capabilities";
import { db } from "@/lib/db";

/** The user's own active sessions — visible and revocable per the brief. */
export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;
  const sessions = await listOwnSessions(user);
  return NextResponse.json({
    sessions: sessions.map((s) => ({ ...s, current: s.id === user.sessionId })),
  });
}

/** Revoke a session: your own always; a team member's with the supervisor
 *  capability. */
export async function DELETE(request: NextRequest) {
  const { user, error } = await requireUser();
  if (error) return error;

  const { sessionId } = (await request.json()) as { sessionId?: string };
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  const target = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!target) {
    return NextResponse.json({ error: "That session no longer exists." }, { status: 404 });
  }

  const ownSession = target.user.entraOid === user.oid;
  if (!ownSession && !can(user.roles, user.surface, "revokeTeamSessions")) {
    return NextResponse.json(
      { error: "You can only revoke your own sessions." },
      { status: 403 },
    );
  }

  await revokeSession(sessionId, user.oid);
  return NextResponse.json({ ok: true });
}
