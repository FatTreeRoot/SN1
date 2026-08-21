import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

/** Fresh test database and mock storage per run. */
export default function globalSetup() {
  const root = path.resolve(__dirname, "..");
  rmSync(path.join(root, "prisma", "test.db"), { force: true });
  rmSync(path.join(root, ".mock-storage-test"), { recursive: true, force: true });
  execSync("npx prisma db push --skip-generate", {
    cwd: root,
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "ignore",
  });
}
