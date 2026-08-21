import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

/** The root routes straight into the product: signed-in users to their
 *  surface, everyone else to sign-in. */
export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(user.surface === "desk" ? "/desk" : "/field");
  redirect("/signin");
}
