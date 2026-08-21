import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { identity } from "@/config/branding";

/** Temporary root page; the Field and Desk surfaces take over from checkpoint 5. */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <BrandMark className="w-48" />
      <div>
        <h1 className="text-h2 font-semibold">{identity.appName}</h1>
        <p className="mt-1 text-ink-muted">
          {identity.nation} · {identity.department}
        </p>
      </div>
      <Link href="/design" className="text-accent underline underline-offset-4">
        Design system
      </Link>
    </main>
  );
}
