import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getVocabularies } from "@/lib/vocab";
import { BulkFiling } from "./BulkFiling";

/** Bulk filing: drag and drop, batch metadata, community email filing. */
export default async function FilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const vocab = getVocabularies();
  return (
    <BulkFiling
      recordTypes={vocab.recordTypes
        .filter((rt) => rt.enabled && rt.surface.includes("desk"))
        .map((rt) => ({ id: rt.id, name: rt.name }))}
      categories={vocab.categories}
      locations={vocab.locations.map((l) => ({ id: l.id, name: l.name }))}
    />
  );
}
