import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { features } from "@/config/features";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { DeskNav } from "./DeskNav";
import { DeskUserCard } from "./DeskUserCard";

/**
 * The Desk surface: desktop, light default, comfortable working density.
 * Navigation is role-aware — links a role cannot use do not render. The
 * sidebar carries the user card: identity, appearance, settings, sign out.
 */
export default async function DeskLayout({ children }: LayoutProps<"/desk">) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  // v1 ships the patroller surface; the office navigation returns when
  // features.officeSurface flips on (config/features.ts)
  const links = (
    features.officeSurface
      ? [
          { href: "/desk", label: "Dashboard", show: can(user.roles, "desk", "viewTeam") },
          { href: "/desk/queue", label: "Queue", show: can(user.roles, "desk", "reviewQueue") },
          { href: "/desk/records", label: "Records", show: can(user.roles, "desk", "viewTeam") },
          { href: "/desk/file", label: "File", show: can(user.roles, "desk", "submit") },
          { href: "/desk/review", label: "Review", show: can(user.roles, "desk", "reviewQueue") },
          { href: "/desk/reconcile", label: "Reconcile", show: can(user.roles, "desk", "submitOnBehalf") },
          { href: "/desk/reports", label: "Reports", show: can(user.roles, "desk", "report") },
          { href: "/desk/audit", label: "Audit", show: can(user.roles, "desk", "viewAudit") },
          { href: "/desk/admin", label: "Admin", show: can(user.roles, "desk", "admin") },
        ]
      : [
          { href: "/desk", label: "Write report", show: can(user.roles, "desk", "submit") },
          { href: "/desk/submissions", label: "My submissions", show: can(user.roles, "desk", "viewOwn") },
          { href: "/desk/settings", label: "Settings", show: true },
        ]
  ).filter((l) => l.show);

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      {/* The Nation's red rule — brand chrome, as on squamish.net */}
      <div aria-hidden className="h-1 shrink-0 bg-accent" />
      <div className="flex flex-1">
        <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-line bg-surface px-4 py-6">
          <div className="flex items-center gap-2.5 px-1">
            <BrandMark variant="compact" className="w-8" />
            <span className="font-display text-body-lg font-semibold">SN Connect</span>
          </div>
          <DeskNav links={links} />
          <DeskUserCard displayName={user.displayName} roles={user.roles} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col bg-bg">{children}</div>
      </div>
    </div>
  );
}
