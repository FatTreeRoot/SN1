import { redirect } from "next/navigation";
import { SettingsPanel } from "@/components/SettingsPanel";
import { identity } from "@/config/branding";
import { getCurrentUser } from "@/lib/auth/session";

export default async function FieldSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return (
    <SettingsPanel
      surface="field"
      displayName={user.displayName}
      email={user.email}
      roles={user.roles}
      appName={identity.appName}
      nation={identity.nation}
      department={identity.department}
      version={identity.appVersion}
    />
  );
}
