import { redirect } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { getCurrentUser, listOwnSessions } from "@/lib/auth/session";
import { SessionList } from "./SessionList";

/** Your signed-in devices — visible and revocable, per the session rules. */
export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const sessions = await listOwnSessions(user);
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <BackButton fallback={user.surface === "desk" ? "/desk/settings" : "/field/settings"} />
      <div>
        <h1 className="text-h2 font-semibold">Your devices</h1>
        <p className="text-ink-muted">
          Signed in as {user.displayName}. Up to three devices at a time — a fourth
          sign-in drops the oldest.
        </p>
      </div>
      <SessionList
        sessions={sessions.map((s) => ({
          id: s.id,
          surface: s.surface,
          deviceLabel: s.deviceLabel,
          lastSeenAt: s.lastSeenAt.toISOString(),
          current: s.id === user.sessionId,
        }))}
      />
    </main>
  );
}
