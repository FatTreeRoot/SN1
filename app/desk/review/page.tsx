import { redirect } from "next/navigation";
import { features } from "@/config/features";
import { getCurrentUser } from "@/lib/auth/session";
import { ReviewPage } from "./ReviewPage";

/** Supervisor review: team submissions, gaps, and queue-age alerts. */
export default async function Review() {
  // Office surface: hidden in v1, returns via config/features.ts
  if (!features.officeSurface) redirect("/desk");
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <ReviewPage />;
}
