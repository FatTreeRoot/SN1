import { redirect } from "next/navigation";
import { features } from "@/config/features";
import { devUsers } from "@/config/dev-users";
import { getCurrentUser } from "@/lib/auth/session";
import { getVocabularies } from "@/lib/vocab";
import { Reconciliation } from "./Reconciliation";

/** Filing from Field Capture Cards after an outage, in date order. */
export default async function ReconcilePage() {
  // Office surface: hidden in v1, returns via config/features.ts
  if (!features.officeSurface) redirect("/desk");
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const vocab = getVocabularies();
  return (
    <Reconciliation
      members={devUsers
        .filter((u) => u.roles.includes("PS-Members"))
        .map((u) => ({ oid: u.oid, name: u.displayName }))}
      recordTypes={vocab.recordTypes
        .filter((rt) => rt.enabled && rt.surface.includes("field"))
        .map((rt) => ({ id: rt.id, name: rt.name }))}
      categories={vocab.categories}
      locations={vocab.locations.map((l) => ({ id: l.id, name: l.name }))}
    />
  );
}
