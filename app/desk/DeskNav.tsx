"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DeskNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {links.map((l) => {
        const active = l.href === "/desk" ? pathname === "/desk" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-2 font-medium ${
              active
                ? "bg-accent-soft text-accent-strong"
                : "text-ink-muted hover:bg-bg hover:text-ink"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
