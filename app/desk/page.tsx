import { redirect } from "next/navigation";
import { features } from "@/config/features";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { getVocabularies } from "@/lib/vocab";
import { Dashboard } from "./Dashboard";
import { WriteReport } from "./WriteReport";

/** Desk home. Patrollers land on the report desk; managers and admins
 *  land on the department dashboard. */
export default async function DeskHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const analyst =
    can(user.roles, "desk", "report") || can(user.roles, "desk", "admin");

  if (!features.officeSurface && !analyst) {
    if (!can(user.roles, "desk", "submit")) redirect("/signin");
    const vocab = getVocabularies();
    return (
      <WriteReport
        recordTypes={vocab.recordTypes
          .filter((rt) => rt.enabled && rt.surface.includes("field") && rt.id !== "RT-FLT")
          .map((rt) => ({ id: rt.id, name: rt.name }))}
        categories={vocab.categories}
        locations={vocab.locations.map((l) => ({ id: l.id, name: l.name, areaId: l.areaId }))}
      />
    );
  }

  if (!analyst && !can(user.roles, "desk", "viewTeam")) {
    redirect(can(user.roles, "desk", "submit") ? "/desk/file" : "/signin");
  }
  return <Dashboard displayName={user.displayName} />;
}
