import { redirect } from "next/navigation";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { getVocabularies } from "@/lib/vocab";
import { RecordsTable } from "./RecordsTable";

export default async function RecordsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  // Oversight stays with team visibility even while the office suite is off
  if (!can(user.roles, "desk", "viewTeam")) redirect("/desk");
  const types = getVocabularies().recordTypes.map((rt) => ({ id: rt.id, name: rt.name }));
  return <RecordsTable types={types} />;
}
