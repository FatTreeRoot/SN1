/**
 * SN Connect — storage routing.
 *
 * The application's core purpose is that users never choose a destination:
 * this table is the destination logic. Record types route to a library key
 * (config/vocabularies.json), library keys route here to a site and library,
 * and items land in shallow Year/Month folders.
 *
 * This is the file to edit when the client supplies the real SharePoint
 * site URLs and library names — nothing in code changes.
 */

/** Confidentiality tiers map to three named SharePoint sites. The Graph
 *  permission model is Sites.Selected: the service identity is granted
 *  write access to these three sites only. */
export const sites = {
  "ps-operations": {
    name: "PS-Operations",
    tier: "standard",
    // [CONFIRM] Replace with the real site URL when IT provisions it
    siteUrl: "https://TENANT.sharepoint.com/sites/PS-Operations",
  },
  "ps-confidential": {
    name: "PS-Confidential",
    tier: "confidential",
    siteUrl: "https://TENANT.sharepoint.com/sites/PS-Confidential",
  },
  "ps-restricted": {
    name: "PS-Restricted",
    tier: "restricted",
    siteUrl: "https://TENANT.sharepoint.com/sites/PS-Restricted",
  },
} as const;

export type SiteKey = keyof typeof sites;

/** Library keys referenced by record-type routing in vocabularies.json. */
export const libraries: Record<
  string,
  { site: SiteKey; libraryName: string }
> = {
  "fleet-checks": { site: "ps-operations", libraryName: "Fleet Checks" },
  "shift-reports": { site: "ps-operations", libraryName: "Shift Reports" },
  "calls-for-service": { site: "ps-confidential", libraryName: "Calls for Service" },
  "escalation-reports": { site: "ps-confidential", libraryName: "Escalation Reports" },
  "community-emails": { site: "ps-confidential", libraryName: "Community Emails" },
  "call-centre-intake": { site: "ps-confidential", libraryName: "Call Centre Intake" },
  "quarterly-reports": { site: "ps-operations", libraryName: "Quarterly Reports" },
  "notebook-scans": { site: "ps-restricted", libraryName: "Notebook Scans" },
  "sensitive-flagged": { site: "ps-restricted", libraryName: "Flagged Sensitive" },
};

/** Items flagged sensitive re-route to the restricted tier regardless of
 *  their record type's default library. Sensitivity can be raised, never
 *  lowered. */
export function resolveLibrary(routingKey: string, sensitivity: string) {
  if (sensitivity === "restricted" && libraries[routingKey].site !== "ps-restricted") {
    return libraries["sensitive-flagged"];
  }
  return libraries[routingKey];
}

/** Shallow Year/Month folders keep libraries under SharePoint's 5,000-item
 *  view degradation. */
export function folderPathFor(recordDate: Date): string {
  const year = recordDate.getFullYear();
  const month = String(recordDate.getMonth() + 1).padStart(2, "0");
  return `${year}/${month}`;
}
