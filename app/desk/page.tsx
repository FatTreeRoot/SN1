import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

/** Placeholder — the full Desk surface arrives at checkpoint 7. */
export default async function DeskPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-h2 font-semibold">Desk</h1>
      <p className="text-ink-muted">
        Signed in as {user.displayName} ({user.roles.join(", ")}).
      </p>
      <p className="text-ink-muted">Queue, filing, and review arrive at checkpoint 7.</p>
      <Link href="/account/sessions" className="text-accent underline underline-offset-4">
        Your devices
      </Link>
    </main>
  );
}
