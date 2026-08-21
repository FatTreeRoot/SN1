import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getVocabularies } from "@/lib/vocab";
import { RecordsTable } from "./RecordsTable";

export default async function RecordsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const types = getVocabularies().recordTypes.map((rt) => ({ id: rt.id, name: rt.name }));
  return <RecordsTable types={types} />;
}
