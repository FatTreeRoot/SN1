import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { EndOfShift } from "./EndOfShift";

export default async function EndShiftPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <EndOfShift />;
}
