import type { Role } from "@/lib/auth/types";

/**
 * Simulated users for AUTH_MODE=dev-bypass — local development and client
 * demonstrations before the Entra app registration is approved. One person
 * per role, plus a supervisor who also patrols. Names are obviously
 * fictional; no real staff are represented.
 */
export type DevUser = {
  oid: string;
  displayName: string;
  email: string;
  roles: Role[];
};

export const devUsers: DevUser[] = [
  {
    oid: "dev-member-1",
    displayName: "Pat Rivers",
    email: "pat.rivers@example.invalid",
    roles: ["PS-Members"],
  },
  {
    oid: "dev-supervisor-1",
    displayName: "Sam Cedar",
    email: "sam.cedar@example.invalid",
    roles: ["PS-Members", "PS-Supervisors"],
  },
  {
    oid: "dev-manager-1",
    displayName: "Morgan Stone",
    email: "morgan.stone@example.invalid",
    roles: ["PS-Members", "PS-Supervisors", "PS-Managers"],
  },
  {
    oid: "dev-callcentre-1",
    displayName: "Call centre service",
    email: "callcentre@example.invalid",
    roles: ["PS-CallCentre"],
  },
  {
    oid: "dev-admin-1",
    displayName: "Alex Marsh",
    email: "alex.marsh@example.invalid",
    roles: ["PS-Admins", "PS-Managers", "PS-Supervisors", "PS-Members"],
  },
];
