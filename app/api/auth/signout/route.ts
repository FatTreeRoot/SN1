import { NextResponse } from "next/server";
import { appendAudit } from "@/lib/auth/audit";
import { getCurrentUser, revokeSession, SESSION_COOKIE } from "@/lib/auth/session";

/** Signs out the current session. The device token stays (it marks the
 *  device as MFA-verified, not the user as signed in). */
export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await revokeSession(user.sessionId, user.oid);
    await appendAudit({ actorOid: user.oid, action: "sign-out", surface: user.surface });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
