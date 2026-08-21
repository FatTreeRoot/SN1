import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

/** Placeholder — the full Field surface arrives at checkpoint 5. */
export default async function FieldPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  return (
    <main className="surface-field mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-h2 font-semibold">Field</h1>
      <p className="text-ink-muted">
        Signed in as {user.displayName} ({user.roles.join(", ")}).
      </p>
      <p className="text-ink-muted">Shift sign-on and filing arrive at checkpoint 5.</p>
      <Link href="/account/sessions" className="text-accent underline underline-offset-4">
        Your devices
      </Link>
    </main>
  );
}
