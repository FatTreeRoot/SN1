import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SubmissionsList } from "./SubmissionsList";

/** My submissions: metadata only, read live on every load, never cached. */
export default async function SubmissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <SubmissionsList />;
}
