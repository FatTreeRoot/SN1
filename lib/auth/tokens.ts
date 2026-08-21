import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

/**
 * Signed tokens for the session cookie and the device token. HS256 with the
 * application secret; short, single-purpose payloads. The browser never
 * holds a Graph credential — these tokens identify a session or a device to
 * this application only.
 */

const encoder = new TextEncoder();

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET must be set (32+ characters)");
  }
  return encoder.encode(s);
}

export async function signToken(
  payload: Record<string, string>,
  purpose: "session" | "device",
  expiresIn: string,
): Promise<string> {
  return new SignJWT({ ...payload, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret());
}

export async function verifyToken(
  token: string,
  purpose: "session" | "device",
): Promise<Record<string, string> | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== purpose) return null;
    return payload as Record<string, string>;
  } catch {
    return null;
  }
}

/** Hash stored server-side for device tokens so a database read alone
 *  cannot mint a valid token. */
export function hashTokenSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
