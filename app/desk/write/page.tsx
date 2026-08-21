import { redirect } from "next/navigation";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { getVocabularies } from "@/lib/vocab";
import { WriteReport } from "../WriteReport";

/** The report desk at its own address, for managers whose home is the
 *  dashboard. Patrollers get the same screen at /desk. */
export default async function WritePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!can(user.roles, "desk", "submit")) redirect("/desk");

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
