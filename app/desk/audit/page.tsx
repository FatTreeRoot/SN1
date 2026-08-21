import { redirect } from "next/navigation";
import { features } from "@/config/features";
import { getCurrentUser } from "@/lib/auth/session";
import { AuditTable } from "./AuditTable";

export default async function AuditPage() {
  // Office surface: hidden in v1, returns via config/features.ts
  if (!features.officeSurface) redirect("/desk");
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <AuditTable />;
}
