import type { Capability, Role, Surface } from "./types";

/**
 * Role capabilities per the client's authorisation table. Roles accumulate:
 * supervisors hold member capabilities, managers hold both.
 */
const roleCapabilities: Record<Role, Capability[]> = {
  "PS-Members": ["submit", "viewOwn"],
  "PS-Supervisors": [
    "submit",
    "viewOwn",
    "viewTeam",
    "submitOnBehalf",
    "reviewQueue",
    "revokeTeamSessions",
  ],
  "PS-Managers": [
    "submit",
    "viewOwn",
    "viewTeam",
    "submitOnBehalf",
    "reviewQueue",
    "revokeTeamSessions",
    "viewAll",
    "viewNarrative",
    "export",
    "report",
    "viewAudit",
  ],
  "PS-CallCentre": ["submitIntake"],
  "PS-Admins": ["admin"],
};

/**
 * Surface scoping: anything that produces a copy of confidential content or
 * displays it at length happens only on the Desk surface, regardless of role.
 * The Field surface runs on the least controlled devices — restriction there
 * is a feature, not a gap.
 */
const fieldDenied: ReadonlySet<Capability> = new Set([
  "export",
  "report",
  "viewNarrative",
  "viewAudit",
  "reviewQueue",
  "admin",
]);

export function capabilitiesFor(roles: Role[], surface: Surface): Set<Capability> {
  const caps = new Set<Capability>();
  for (const role of roles) {
    for (const cap of roleCapabilities[role] ?? []) caps.add(cap);
  }
  if (surface === "field") {
    for (const denied of fieldDenied) caps.delete(denied);
  }
  return caps;
}

export function can(roles: Role[], surface: Surface, capability: Capability): boolean {
  return capabilitiesFor(roles, surface).has(capability);
}
