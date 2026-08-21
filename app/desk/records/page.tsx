import { redirect } from "next/navigation";
import { features } from "@/config/features";
import { getCurrentUser } from "@/lib/auth/session";
import { getVocabularies } from "@/lib/vocab";
import { RecordsTable } from "./RecordsTable";

export default async function RecordsPage() {
  // Office surface: hidden in v1, returns via config/features.ts
  if (!features.officeSurface) redirect("/desk");
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const types = getVocabularies().recordTypes.map((rt) => ({ id: rt.id, name: rt.name }));
  return <RecordsTable types={types} />;
}
