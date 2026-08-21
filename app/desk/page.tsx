import { redirect } from "next/navigation";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { Dashboard } from "./Dashboard";

/** Desk home: the department at a glance. */
export default async function DeskHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!can(user.roles, "desk", "viewTeam")) {
    redirect(can(user.roles, "desk", "submit") ? "/desk/file" : "/signin");
  }
  return <Dashboard displayName={user.displayName} />;
}
