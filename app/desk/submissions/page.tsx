import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { DeskSubmissions } from "./DeskSubmissions";

/** My submissions on the desktop: metadata only, read live. */
export default async function DeskSubmissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <DeskSubmissions />;
}
