import { redirect } from "next/navigation";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { QueuePage } from "../QueuePage";

/** Call-centre intake awaiting triage. */
export default async function Queue() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!can(user.roles, "desk", "reviewQueue")) redirect("/desk");
  return <QueuePage />;
}
