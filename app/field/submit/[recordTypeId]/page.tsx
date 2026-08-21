import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveShift } from "@/lib/shift";
import { getVocabularies } from "@/lib/vocab";
import { SubmitFlow } from "./SubmitFlow";

/** The three-tap flow: record type tile brought the user here; category
 *  tile and capture remain. Four fields maximum, all defaulted. */
export default async function SubmitPage({
  params,
}: PageProps<"/field/submit/[recordTypeId]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const shift = await getActiveShift(user.oid);
  if (!shift) redirect("/field/shift");

  const { recordTypeId } = await params;
  const vocab = getVocabularies();
  const recordType = vocab.recordTypes.find(
    (rt) => rt.id === recordTypeId && rt.enabled && rt.surface.includes("field"),
  );
  if (!recordType) notFound();

  return (
    <SubmitFlow
      recordType={{ id: recordType.id, name: recordType.name, code: recordType.code }}
      categories={vocab.categories}
      locations={vocab.locations}
      shiftAreaId={shift.areaId}
      needsCategory={["RT-CFS", "RT-ESC"].includes(recordType.id)}
    />
  );
}
