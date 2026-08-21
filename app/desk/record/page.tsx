import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getVocabularies } from "@/lib/vocab";
import { RecordView } from "./RecordView";

/** Full record view with narrative, versions, and the correction flow. */
export default async function RecordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const vocab = getVocabularies();
  return (
    <RecordView
      categories={vocab.categories}
      locations={vocab.locations.map((l) => ({ id: l.id, name: l.name }))}
      recordTypes={vocab.recordTypes
        .filter((rt) => rt.enabled && rt.id !== "RT-CCI")
        .map((rt) => ({ id: rt.id, name: rt.name }))}
    />
  );
}
