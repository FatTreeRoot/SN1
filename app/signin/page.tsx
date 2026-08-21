import { BrandMark } from "@/components/BrandMark";
import { HorizonBackdrop } from "@/components/HorizonBackdrop";
import { HorizonRule } from "@/components/ui/HorizonRule";
import { identity } from "@/config/branding";
import { devUsers } from "@/config/dev-users";
import { DevSignIn } from "./DevSignIn";

/**
 * Sign-in: the horizon assembling into the application. The Microsoft
 * button is the production path; until the tenant app registration exists
 * (docs/IT-REQUEST.md) it opens the demo access section instead.
 */
export default function SignInPage() {
  const bypass = process.env.AUTH_MODE === "dev-bypass";
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col">
      <HorizonBackdrop />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10">
        <div className="flex flex-1 flex-col justify-center gap-8">
          <div className="flex flex-col items-center gap-5 text-center">
            <BrandMark className="w-72" />
            <div className="flex flex-col items-center gap-3">
              <HorizonRule />
              <h1 className="font-display text-display font-semibold leading-tight">
                {identity.appName}
              </h1>
              <p className="max-w-xs text-ink-muted">
                Records for the {identity.department}. Filed once, filed right.
              </p>
            </div>
          </div>

          <DevSignIn
            bypass={bypass}
            users={devUsers.map((u) => ({
              oid: u.oid,
              displayName: u.displayName,
              roles: u.roles,
            }))}
          />
        </div>

        <footer className="flex flex-col items-center gap-0.5 pt-8 text-center text-caption text-ink-muted">
          <p>
            {identity.nation} · {identity.department}
          </p>
          <p className="font-data">
            {identity.appName} {identity.appVersion}
          </p>
        </footer>
      </div>
    </main>
  );
}
