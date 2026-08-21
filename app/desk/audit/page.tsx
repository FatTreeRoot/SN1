import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuditTable } from "./AuditTable";

export default async function AuditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <AuditTable />;
}
