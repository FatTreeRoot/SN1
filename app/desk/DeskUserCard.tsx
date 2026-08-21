"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { IconGear, IconSignOut } from "@/components/icons";
import { ThemeCycleButton } from "@/lib/theme/ThemeToggle";

/** Sidebar footer: who is signed in, settings, appearance, sign out. */
export function DeskUserCard({
  displayName,
  roles,
}: {
  displayName: string;
  roles: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/signin");
    router.refresh();
  }

  return (
    <div className="mt-auto flex flex-col gap-3 rounded-xl border border-line bg-raised p-3">
      <div className="flex items-center gap-3">
        <Avatar name={displayName} />
        <div className="min-w-0">
          <p className="truncate font-medium leading-tight">{displayName}</p>
          <p className="truncate text-caption text-ink-muted">
            {roles.map((r) => r.replace("PS-", "")).join(" · ")}
          </p>
        </div>
      </div>

      <Link
        href="/desk/settings"
        className="pressable flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 font-medium text-ink-muted hover:text-ink"
      >
        <IconGear className="h-4.5 w-4.5" />
        Settings
      </Link>

      <div className="flex items-center gap-1.5">
        <ThemeCycleButton className="flex-1" />
        <button
          onClick={signOut}
          disabled={busy}
          aria-label="Sign out"
          title="Sign out"
          className="pressable rounded-md border border-line bg-surface p-2 text-ink-muted hover:border-urgent hover:text-urgent disabled:opacity-50"
        >
          <IconSignOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
