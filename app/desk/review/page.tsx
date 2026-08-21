import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { ReviewPage } from "./ReviewPage";

/** Supervisor review: team submissions, gaps, and queue-age alerts. */
export default async function Review() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <ReviewPage />;
}
