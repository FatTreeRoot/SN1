/** Application roles, mapped 1:1 from Entra security groups. */
export const ROLES = [
  "PS-Members",
  "PS-Supervisors",
  "PS-Managers",
  "PS-CallCentre",
  "PS-Admins",
] as const;
export type Role = (typeof ROLES)[number];

/** The two interactive surfaces. Capability is scoped by surface: a
 *  supervisor on a phone is still restricted to Field capabilities. */
export type Surface = "field" | "desk";

export type Capability =
  | "submit" // file any record type
  | "submitIntake" // call-centre intake only
  | "viewOwn" // own submissions, metadata only
  | "viewTeam" // team submissions
  | "viewAll" // all records
  | "viewNarrative" // full narrative content (Desk only, ever)
  | "submitOnBehalf" // supervisors filing for a member
  | "reviewQueue" // triage automated intake
  | "export" // anything producing a copy of content (Desk only, ever)
  | "report" // run/aggregate reports (Desk only, ever)
  | "viewAudit"
  | "admin" // record types, categories, routing, metadata schema
  | "revokeTeamSessions";

/** The signed-in principal, resolved server-side on every request.
 *  Roles are never trusted from the client. */
export type AppUser = {
  oid: string;
  displayName: string;
  email: string;
  roles: Role[];
  sessionId: string;
  surface: Surface;
};
