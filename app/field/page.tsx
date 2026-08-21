import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveShift } from "@/lib/shift";
import { getVocabularies } from "@/lib/vocab";
import {
  IconClipboard,
  IconFlag,
  IconList,
  IconMoon,
  IconPhone,
  IconTruck,
} from "@/components/icons";
import { t } from "@/config/strings";

const iconFor: Record<string, React.ReactNode> = {
  "RT-CFS": <IconPhone />,
  "RT-ESC": <IconFlag />,
  "RT-FLT": <IconTruck />,
  "RT-SHF": <IconClipboard />,
};

/**
 * Field home: a grid of large record-type tiles — the entire mental model
 * is "tap what kind of thing you have." Three taps to capture from here.
 */
export default async function FieldHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const shift = await getActiveShift(user.oid);
  if (!shift) redirect("/field/shift");

  const recordTypes = getVocabularies().recordTypes.filter(
    (rt) => rt.enabled && rt.surface.includes("field") && rt.id !== "RT-FLT",
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6">
      <div className="grid grid-cols-2 gap-3">
        {recordTypes.map((rt) => (
          <Link
            key={rt.id}
            href={`/field/submit/${rt.id}`}
            className="pressable flex min-h-28 flex-col items-start justify-between gap-2 rounded-lg border border-line bg-surface p-4 text-left hover:border-line-strong"
          >
            <span aria-hidden className="text-accent [&>svg]:h-7 [&>svg]:w-7">
              {iconFor[rt.id] ?? <IconClipboard />}
            </span>
            <span className="font-display text-body-lg font-medium leading-tight">
              {rt.name}
            </span>
          </Link>
        ))}
      </div>

      <nav className="mt-auto flex flex-col gap-2">
        <Link
          href="/field/submissions"
          className="pressable flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 font-medium"
        >
          <IconList className="h-5 w-5 text-ink-muted" />
          {t("mySubmissions")}
        </Link>
        <Link
          href="/field/end"
          className="pressable flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 font-medium"
        >
          <IconMoon className="h-5 w-5 text-ink-muted" />
          {t("endShift")}
        </Link>
      </nav>
    </main>
  );
}
