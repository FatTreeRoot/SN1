import { BrandMark } from "@/components/BrandMark";
import { identity } from "@/config/branding";
import { devUsers } from "@/config/dev-users";
import { DevSignIn } from "./DevSignIn";

/**
 * Sign-in. In dev-bypass mode this lists simulated users; in entra mode it
 * becomes the Entra redirect with the horizon login animation (checkpoint 5).
 */
export default function SignInPage() {
  const bypass = process.env.AUTH_MODE === "dev-bypass";
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandMark className="w-44" />
        <div>
          <h1 className="text-h2 font-semibold">{identity.appName}</h1>
          <p className="text-ink-muted">
            {identity.nation} · {identity.department}
          </p>
        </div>
      </div>
      {bypass ? (
        <DevSignIn
          users={devUsers.map((u) => ({
            oid: u.oid,
            displayName: u.displayName,
            roles: u.roles,
          }))}
        />
      ) : (
        <p className="text-center text-ink-muted">
          Sign in with your Squamish Nation account.
        </p>
      )}
    </main>
  );
}
