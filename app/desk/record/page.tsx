import { redirect } from "next/navigation";
import { features } from "@/config/features";
import { getCurrentUser } from "@/lib/auth/session";
import { getVocabularies } from "@/lib/vocab";
import { RecordView } from "./RecordView";

/** Full record view with narrative, versions, and the correction flow. */
export default async function RecordPage() {
  // Office surface: hidden in v1, returns via config/features.ts
  if (!features.officeSurface) redirect("/desk");
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
