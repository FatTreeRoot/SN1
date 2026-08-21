import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { FilingSheet } from "./FilingSheet";

/** Outstanding items with temporary references, for handing to a
 *  supervisor at end of shift. Print-ready. */
export default async function FilingSheetPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <FilingSheet displayName={user.displayName} />;
}
