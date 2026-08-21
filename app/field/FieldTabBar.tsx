"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGear, IconHome, IconList } from "@/components/icons";
import { usePendingQueue } from "@/lib/queue";

const tabs = [
  { href: "/field", label: "Home", icon: IconHome },
  { href: "/field/submissions", label: "Submissions", icon: IconList },
  { href: "/field/settings", label: "Settings", icon: IconGear },
];

/** The thumb-zone tab bar: three destinations, 48px+ targets, safe-area
 *  aware. The submissions tab carries the pending count. */
export function FieldTabBar() {
  const pathname = usePathname();
  const { count } = usePendingQueue();

  // The sign-on ritual and submit flow own the whole screen
  if (pathname === "/field/shift" || pathname.startsWith("/field/submit/")) return null;

  return (
    <nav
      aria-label="Main"
      className="sticky bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-md">
        {tabs.map((tab) => {
          const active =
            tab.href === "/field" ? pathname === "/field" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`pressable relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 ${
                active ? "text-accent" : "text-ink-muted"
              }`}
            >
              <span className="relative">
                <Icon className="h-6 w-6" />
                {tab.href === "/field/submissions" && count > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pending px-1 font-data text-[11px] font-semibold text-on-accent">
                    {count}
                  </span>
                )}
              </span>
              <span className="text-[12px] font-medium">{tab.label}</span>
              {active && (
                <span aria-hidden className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
