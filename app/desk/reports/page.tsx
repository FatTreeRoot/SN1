import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ReportBuilder } from "./ReportBuilder";

/** Quarterly report builder: on-screen aggregates plus the Council PDF. */
export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <ReportBuilder />;
}
