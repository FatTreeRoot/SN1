import { getCurrentUser } from "@/lib/auth/session";
import { paperModeActive } from "@/lib/paper-mode";
import { getActiveShift } from "@/lib/shift";
import { FieldHeader } from "./FieldHeader";
import { FieldTabBar } from "./FieldTabBar";
import { InstallWalkthrough } from "./InstallWalkthrough";

/**
 * The Field surface: phone-first, one-handed, home-screen installed.
 * The app launches light; patrollers working nights switch to dark (or
 * Auto) in Settings and the choice sticks to their device.
 */

export default async function FieldLayout({ children }: LayoutProps<"/field">) {
  const user = await getCurrentUser();
  const shift = user ? await getActiveShift(user.oid) : null;
  const paperMode = user ? await paperModeActive() : { active: false };

  return (
    <div className="surface-field flex min-h-dvh flex-1 flex-col">
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
