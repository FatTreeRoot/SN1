import { redirect } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { DeskNav } from "./DeskNav";

/**
 * The Desk surface: desktop, light default, comfortable working density.
 * Navigation is role-aware — links a role cannot use do not render.
 */
export default async function DeskLayout({ children }: LayoutProps<"/desk">) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const links = [
    { href: "/desk", label: "Queue", show: can(user.roles, "desk", "reviewQueue") },
    { href: "/desk/records", label: "Records", show: can(user.roles, "desk", "viewTeam") },
    { href: "/desk/file", label: "File", show: can(user.roles, "desk", "submit") },
    { href: "/desk/review", label: "Review", show: can(user.roles, "desk", "reviewQueue") },
    { href: "/desk/reconcile", label: "Reconcile", show: can(user.roles, "desk", "submitOnBehalf") },
    { href: "/desk/reports", label: "Reports", show: can(user.roles, "desk", "report") },
    { href: "/desk/audit", label: "Audit", show: can(user.roles, "desk", "viewAudit") },
    { href: "/desk/admin", label: "Admin", show: can(user.roles, "desk", "admin") },
  ].filter((l) => l.show);

  return (
    <div className="flex min-h-dvh flex-1">
      <aside className="flex w-56 shrink-0 flex-col gap-6 border-r border-line bg-surface px-4 py-6">
        <div className="flex items-center gap-2.5">
          <BrandMark variant="compact" className="w-8" />
          <span className="font-display font-semibold">SN Connect</span>
        </div>
        <DeskNav links={links} />
        <div className="mt-auto text-caption text-ink-muted">
          <p className="font-medium text-ink">{user.displayName}</p>
          <p>{user.roles.join(" · ")}</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
