import { redirect } from "next/navigation";
import { features } from "@/config/features";
import columnsJson from "@/config/columns.json";
import { libraries, sites } from "@/config/storage-map";
import { can } from "@/lib/auth/capabilities";
import { getCurrentUser } from "@/lib/auth/session";
import { getVocabularies } from "@/lib/vocab";
import { AdminPanel } from "./AdminPanel";

export default async function AdminPage() {
  // Office surface: hidden in v1, returns via config/features.ts
  if (!features.officeSurface) redirect("/desk");
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!can(user.roles, "desk", "admin")) {
    return <main className="px-8 py-8 text-ink-muted">Admin needs the PS-Admins role.</main>;
  }

  const vocab = getVocabularies();
  const routing = Object.entries(libraries).map(([key, lib]) => ({
    key,
    site: sites[lib.site].name,
    library: lib.libraryName,
  }));

  return (
    <AdminPanel
      provisional={vocab.provisional}
      vocab={{
        recordTypes: vocab.recordTypes.map((rt) => ({
          id: rt.id,
          name: rt.name,
          enabled: rt.enabled,
          routing: rt.routing,
          sensitivityDefault: rt.sensitivityDefault,
        })),
        categories: vocab.categories,
        locations: vocab.locations,
        vehicles: vocab.vehicles,
      }}
      routing={routing}
      excel={{
        tableName: columnsJson.tableName,
        workbookPath: columnsJson.workbookPath,
        columns: columnsJson.columns,
      }}
    />
  );
}
