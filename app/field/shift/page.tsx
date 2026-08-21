import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveShift } from "@/lib/shift";
import { getVocabularies } from "@/lib/vocab";
import { devUsers } from "@/config/dev-users";
import { ShiftSignOn } from "./ShiftSignOn";

/** The start-of-shift ritual. Already signed on? Straight to home. */
export default async function ShiftPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const active = await getActiveShift(user.oid);
  if (active) redirect("/field");

  const vocab = getVocabularies();
  const partners = devUsers
    .filter((u) => u.roles.includes("PS-Members") && u.oid !== user.oid)
    .map((u) => ({ oid: u.oid, name: u.displayName }));

  return (
    <ShiftSignOn
      displayName={user.displayName}
      vehicles={vocab.vehicles}
      areas={vocab.areas.filter((a) => a.id !== "AREA-OT")}
      partners={partners}
    />
  );
}
