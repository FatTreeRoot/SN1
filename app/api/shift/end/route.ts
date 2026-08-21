import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/guard";
import { revokeSession, SESSION_COOKIE } from "@/lib/auth/session";
import { endShift } from "@/lib/shift";

/** End of shift: closes the shift and signs the session out. The client
 *  clears its local storage on the response. */
export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  await endShift(user.oid);
  await revokeSession(user.sessionId, user.oid);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
