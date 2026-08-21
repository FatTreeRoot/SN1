import { getCurrentUser } from "@/lib/auth/session";
import { paperModeActive } from "@/lib/paper-mode";
import { getActiveShift } from "@/lib/shift";
import { FieldHeader } from "./FieldHeader";
import { FieldTabBar } from "./FieldTabBar";
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
  const paperMode = user ? await paperModeActive() : { active: false };

  return (
    <div className="surface-field flex min-h-dvh flex-1 flex-col">
      <script dangerouslySetInnerHTML={{ __html: fieldThemeJs }} />
      {paperMode.active && (
        <p className="border-b-2 border-pending bg-pending-soft px-4 py-2.5 text-center font-medium text-pending">
          Paper only right now — capture on paper, file with your supervisor at end of
          shift.
        </p>
      )}
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
      {user && <FieldTabBar />}
      <InstallWalkthrough />
    </div>
  );
}
