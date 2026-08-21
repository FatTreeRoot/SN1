import { NextResponse } from "next/server";
import { appendAudit } from "./audit";
import { can } from "./capabilities";
import { getCurrentUser } from "./session";
import type { AppUser, Capability } from "./types";

/**
 * Route-handler guard. Roles and capability are resolved server-side from
 * the validated session on every request; failed authorisation attempts are
 * audited per the security requirements.
 */
export async function requireUser(
  capability?: Capability,
): Promise<{ user: AppUser; error?: never } | { user?: never; error: NextResponse }> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Your session ended. Sign in again to continue." },
        { status: 401 },
      ),
    };
  }
  if (capability && !can(user.roles, user.surface, capability)) {
    await appendAudit({
      actorOid: user.oid,
      action: "authz-denied",
      surface: user.surface,
      detail: { capability },
    });
    return {
      error: NextResponse.json(
        { error: "You do not have access to do that here." },
        { status: 403 },
      ),
    };
  }
  return { user };
}
