import { NextRequest, NextResponse } from "next/server";
import { devUsers } from "@/config/dev-users";
import { db } from "@/lib/db";
import {
  createSession,
  issueDeviceToken,
  verifyDeviceToken,
  DEVICE_COOKIE,
  SESSION_COOKIE,
} from "@/lib/auth/session";

/**
 * Dev-bypass sign-in: selects a simulated user from config/dev-users.ts.
 * In entra mode this route hands off to the Entra authorization code flow
 * (PKCE) instead — no local accounts, no passwords in this system, ever.
 */
export async function POST(request: NextRequest) {
  if (process.env.AUTH_MODE !== "dev-bypass") {
    return NextResponse.json(
      { error: "Sign-in is handled by Microsoft Entra ID." },
      { status: 501 },
    );
  }

  const body = (await request.json()) as { oid?: string; surface?: string };
  const surface = body.surface === "desk" ? "desk" : "field";
  const devUser = devUsers.find((u) => u.oid === body.oid);
  if (!devUser) {
    return NextResponse.json({ error: "Unknown development user." }, { status: 400 });
  }

  // Device token check simulates the MFA gate: a device holding a valid
  // token skips MFA; a new device would be challenged (real MFA arrives
  // with Entra mode — the issuance/verification path is the production one).
  const existingDevice = request.cookies.get(DEVICE_COOKIE)?.value;
  let deviceTokenId: string | undefined;
  let mfaPerformed = false;
  if (existingDevice) {
    deviceTokenId = (await verifyDeviceToken(existingDevice, devUser.oid)) ?? undefined;
  }
  if (!deviceTokenId) mfaPerformed = true;

  const ua = request.headers.get("user-agent") ?? "";
  const deviceLabel = summariseUa(ua);

  const { sessionCookie, expiresAt } = await createSession({
    oid: devUser.oid,
    displayName: devUser.displayName,
    email: devUser.email,
    surface,
    deviceLabel,
    deviceTokenId,
  });

  const user = await db.user.findUniqueOrThrow({ where: { entraOid: devUser.oid } });
  const response = NextResponse.json({
    ok: true,
    displayName: devUser.displayName,
    needsAcknowledgement: !user.acceptedUseAt,
    mfaPerformed,
  });

  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  if (!deviceTokenId) {
    const deviceToken = await issueDeviceToken(devUser.oid);
    response.cookies.set(DEVICE_COOKIE, deviceToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 180 * 24 * 3600,
    });
  }

  return response;
}

function summariseUa(ua: string): string {
  const device = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac/.test(ua)
            ? "Mac"
            : "Device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : "Browser";
  return `${device} · ${browser}`;
}
