import { redirect } from "next/navigation";
import { features } from "@/config/features";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { QueuePage } from "../QueuePage";

/** Call-centre intake awaiting triage. */
export default async function Queue() {
  // Office surface: hidden in v1, returns via config/features.ts
  if (!features.officeSurface) redirect("/desk");
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!can(user.roles, "desk", "reviewQueue")) redirect("/desk");
  return <QueuePage />;
}
