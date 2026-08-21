/**
 * Feature flags. The full office surface (dashboard, queue, review, audit,
 * admin, reporting, reconciliation) is built and kept in the codebase;
 * v1 focuses on the patroller workflow, so it ships switched off. Flip to
 * true and the office navigation and pages return — nothing was removed.
 */
export const features = {
  /** The full office suite (triage queue, review, reconcile, bulk filing,
   *  audit, admin screens). Managers and admins keep the dashboard,
   *  records table, and analytics reports regardless of this flag. */
  officeSurface: false,
} as const;
