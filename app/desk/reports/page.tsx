import { redirect } from "next/navigation";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { ReportBuilder } from "./ReportBuilder";

/** Quarterly report builder: on-screen aggregates plus the Council PDF. */
export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  // Analytics stay with the report capability, office suite or not
  if (!can(user.roles, "desk", "report")) redirect("/desk");
  return <ReportBuilder />;
}
