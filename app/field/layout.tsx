import { getCurrentUser } from "@/lib/auth/session";
import { getActiveShift } from "@/lib/shift";
import { FieldHeader } from "./FieldHeader";
import { InstallWalkthrough } from "./InstallWalkthrough";

/**
 * The Field surface: phone-first, one-handed, home-screen installed.
 * Dark by default — the theme script below runs before hydration so a
 * night shift never opens onto a white screen. A stored user choice wins.
 */
const fieldThemeJs = `
(function () {
  try {
    if (!localStorage.getItem("sn-theme")) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch (e) {}
})();
`;

export default async function FieldLayout({ children }: LayoutProps<"/field">) {
  const user = await getCurrentUser();
  const shift = user ? await getActiveShift(user.oid) : null;

  return (
    <div className="surface-field flex min-h-dvh flex-1 flex-col">
      <script dangerouslySetInnerHTML={{ __html: fieldThemeJs }} />
      {user && (
        <FieldHeader
          displayName={user.displayName}
          shift={
            shift
              ? {
                  vehicleName: shift.vehicleName,
                  areaName: shift.areaName,
                  partnerName: shift.partnerName,
                  startedAt: shift.startedAt.toISOString(),
                }
              : null
          }
        />
      )}
      {children}
      <InstallWalkthrough />
    </div>
  );
}
