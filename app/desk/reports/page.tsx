import { redirect } from "next/navigation";
import { features } from "@/config/features";
import { getCurrentUser } from "@/lib/auth/session";
import { ReportBuilder } from "./ReportBuilder";

/** Quarterly report builder: on-screen aggregates plus the Council PDF. */
export default async function ReportsPage() {
  // Office surface: hidden in v1, returns via config/features.ts
  if (!features.officeSurface) redirect("/desk");
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <ReportBuilder />;
}
