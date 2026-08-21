import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { devUsers } from "@/config/dev-users";
import { appendAudit } from "./audit";
import { hashTokenSecret, signToken, verifyToken } from "./tokens";
import type { AppUser, Role, Surface } from "./types";

export const SESSION_COOKIE = "sn-session";
export const DEVICE_COOKIE = "sn-device";

function maxSessions(): number {
  return Number(process.env.MAX_SESSIONS_PER_USER ?? 3);
}

function sessionHours(surface: Surface): number {
  return surface === "field"
    ? Number(process.env.SESSION_FIELD_MAX_HOURS ?? 14)
    : Number(process.env.SESSION_DESK_MAX_HOURS ?? 24);
}

/**
 * Server-side role resolution on every request — never trusted from the
 * client. In dev-bypass mode roles come from config/dev-users.ts; in entra
 * mode from the validated token's group claims. Removal from a group takes
 * effect on the next request because this runs on the next request.
 */
async function resolveRoles(oid: string): Promise<Role[]> {
  if (process.env.AUTH_MODE === "entra") {
    // Entra mode: roles resolve from validated group claims at sign-in and
    // are re-checked against Graph on a short cache. Wired at checkpoint 10+
    // when the tenant exists; the structure is here so nothing above changes.
    throw new Error("Entra role resolution requires tenant configuration");
  }
  const user = devUsers.find((u) => u.oid === oid);
  return user?.roles ?? [];
}

/**
 * Create a session for an authenticated principal. Enforces the device cap:
 * a sign-in beyond the cap revokes the oldest active session.
 */
export async function createSession(input: {
  oid: string;
  displayName: string;
  email: string;
  surface: Surface;
  deviceLabel: string;
  deviceTokenId?: string;
}): Promise<{ sessionCookie: string; expiresAt: Date }> {
  const user = await db.user.upsert({
    where: { entraOid: input.oid },
    create: { entraOid: input.oid, displayName: input.displayName, email: input.email },
    update: { displayName: input.displayName, email: input.email },
  });

  const active = await db.session.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
  });
  // The cap is per user across devices: a fourth sign-in drops the oldest.
  while (active.length >= maxSessions()) {
    const oldest = active.shift()!;
    await db.session.update({ where: { id: oldest.id }, data: { revokedAt: new Date() } });
  }

  const hours = sessionHours(input.surface);
  const expiresAt = new Date(Date.now() + hours * 3600_000);
  const session = await db.session.create({
    data: {
      userId: user.id,
      surface: input.surface,
      deviceLabel: input.deviceLabel,
      deviceTokenId: input.deviceTokenId,
      expiresAt,
    },
  });

  await appendAudit({
    actorOid: input.oid,
    action: "sign-in",
    surface: input.surface,
    detail: { sessionId: session.id },
  });

  const sessionCookie = await signToken({ sid: session.id, oid: input.oid }, "session", `${hours}h`);
  return { sessionCookie, expiresAt };
}

/**
 * Resolve the current user from the session cookie. Validates the signature,
 * the session row (revocation, expiry), and re-resolves roles server-side.
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const payload = await verifyToken(raw, "session");
  if (!payload?.sid) return null;

  const session = await db.session.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  const roles = await resolveRoles(session.user.entraOid);
  // Removed from every group: the session dies on this request.
  if (roles.length === 0) {
    await db.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return null;
  }

  // Touch lastSeen no more than once a minute to keep writes down
  if (Date.now() - session.lastSeenAt.getTime() > 60_000) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }

  return {
    oid: session.user.entraOid,
    displayName: session.user.displayName,
    email: session.user.email,
    roles,
    sessionId: session.id,
    surface: session.surface as Surface,
  };
}

export async function revokeSession(sessionId: string, actorOid: string) {
  await db.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  await appendAudit({ actorOid, action: "revoke-session", detail: { sessionId } });
}

export async function listOwnSessions(user: AppUser) {
  const dbUser = await db.user.findUnique({ where: { entraOid: user.oid } });
  if (!dbUser) return [];
  return db.session.findMany({
    where: { userId: dbUser.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    select: { id: true, surface: true, deviceLabel: true, createdAt: true, lastSeenAt: true },
  });
}

/**
 * Device tokens: issued after MFA, bound to the user. Presenting a valid one
 * skips MFA next sign-in. In dev-bypass mode issuance is simulated at
 * sign-in; the verification path is the real one.
 */
export async function issueDeviceToken(oid: string): Promise<string> {
  const user = await db.user.findUniqueOrThrow({ where: { entraOid: oid } });
  const record = await db.deviceToken.create({
    data: { userId: user.id, secretHash: "" },
  });
  const token = await signToken({ did: record.id, oid }, "device", "180d");
  await db.deviceToken.update({
    where: { id: record.id },
    data: { secretHash: hashTokenSecret(token) },
  });
  return token;
}

export async function verifyDeviceToken(raw: string, oid: string): Promise<string | null> {
  const payload = await verifyToken(raw, "device");
  if (!payload?.did || payload.oid !== oid) return null;
  const record = await db.deviceToken.findUnique({ where: { id: payload.did } });
  if (!record || record.revokedAt) return null;
  if (record.secretHash !== hashTokenSecret(raw)) return null;
  await db.deviceToken.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });
  return record.id;
}
