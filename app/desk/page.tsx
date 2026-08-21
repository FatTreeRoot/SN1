import { redirect } from "next/navigation";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { QueuePage } from "./QueuePage";

/** Desk home is the triage queue: automated intake awaiting a human. */
export default async function DeskHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!can(user.roles, "desk", "reviewQueue")) {
    // Members and call-centre land on filing instead
    redirect(can(user.roles, "desk", "submit") ? "/desk/file" : "/signin");
  }
  return <QueuePage />;
}
