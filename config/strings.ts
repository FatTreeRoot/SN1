/**
 * SN Connect — interface strings.
 *
 * Every user-facing string lives here, written deliberately: plain verbs,
 * sentence case, no filler, no exclamation marks. Things are named by what a
 * patroller controls, never by how the system works. Actions keep their name
 * through a whole flow: the button says "File it", the confirmation says
 * "Filed". Errors say what happened and what to do next; they never
 * apologise. Empty states invite an action.
 *
 * Language hook: any entry may carry an `sn` value — a Sḵwx̱wú7mesh sníchim
 * term supplied by the Nation. Nothing is ever invented or machine-translated;
 * a supplied term renders alongside or in place of the English per the
 * Nation's direction. Until supplied, `sn` stays undefined.
 */

export type LocalizedString = {
  en: string;
  /** Supplied by the Nation only. Never generated. */
  sn?: string;
};

export const strings = {
  // Sign in
  signIn: { en: "Sign in" },
  signInHint: { en: "Use your Squamish Nation account" },
  acceptableUseTitle: { en: "Before you start" },
  acceptableUseBody: {
    en: "This system holds confidential community information. Use it only for department work. Screenshots cannot be blocked on your device — do not capture or share record content.",
  },
  acceptableUseAgree: { en: "I understand" },

  // Shift sign-on
  startShift: { en: "Start shift" },
  shiftVehicle: { en: "Vehicle" },
  shiftArea: { en: "Area" },
  shiftPartner: { en: "Partner" },
  shiftWalkaround: { en: "Vehicle walkaround" },
  shiftWalkaroundHint: { en: "Optional photo and damage note" },
  endShift: { en: "End shift" },

  // Home and filing
  pendingOne: { en: "1 item not yet filed" },
  pendingMany: { en: "{count} items not yet filed" },
  fileIt: { en: "File it" },
  filed: { en: "Filed" },
  notYetFiled: { en: "Not yet filed" },
  superseded: { en: "Superseded" },
  urgent: { en: "Urgent" },
  writeItDown: { en: "Write this on your notebook page" },
  mySubmissions: { en: "My submissions" },
  mySubmissionsEmpty: { en: "Nothing filed in the last 30 days. File something and it will show here." },

  // End of shift
  queueClear: { en: "Everything is filed. You are signed out." },
  queueNotClear: {
    en: "{count} items are not yet filed. File them now, or print a filing sheet for your supervisor.",
  },
  filingSheet: { en: "Filing sheet" },

  // Errors — what happened, what to do next. Never apologise.
  errorOffline: { en: "No connection. Your item is kept on this device and will file when you are back in signal." },
  errorRetrying: { en: "The server did not confirm. Retrying — keep the app open if you can." },
  errorSession: { en: "Your session ended. Sign in again to continue." },

  // Install walkthrough
  installTitle: { en: "Put SN Connect on your home screen" },
  installBody: { en: "It opens faster and works like an app." },
  installDismiss: { en: "Not now" },
} as const;

export type StringKey = keyof typeof strings;

/** Resolve a string, substituting {tokens} from vars. Prefers a Nation-supplied
 *  Sḵwx̱wú7mesh sníchim value when present and requested. */
export function t(
  key: StringKey,
  vars?: Record<string, string | number>,
  opts?: { preferSn?: boolean },
): string {
  const entry: LocalizedString = strings[key];
  let out = opts?.preferSn && entry.sn ? entry.sn : entry.en;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}
