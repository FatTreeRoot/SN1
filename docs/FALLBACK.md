# SN Connect — paper procedures

Paper is the primary capture medium at the scene; the application's job begins when a
patroller has signal and a free hand. These procedures are built into the product, not
just this document.

## The normal path

1. Capture on paper at the scene. Write an occurrence number from your pre-issued
   block (shown on your home screen at sign-on) on the page.
2. When you have signal and a free hand, file from the paper: three taps, the fields
   in the same order as your notes.
3. If the server does not confirm, the item stays on your device with the pending
   banner lit, retrying on its own. It is not filed until the banner clears.

## When items are still pending at end of shift

End of shift will not let a pending queue leave silently. It offers:

- **Try filing them now** — one more sync attempt, each item individually.
- **Filing sheet** (`Field → End shift → Filing sheet`) — a printable list of what is
  outstanding, each with a temporary reference (T-01, T-02 …) and a blank occurrence
  column for office use. Hand it to your supervisor.

## Paper-only mode

When the system or tenant is down, a supervisor declares **paper only** from
`Desk → Reconcile`. Every signed-in user immediately sees the banner; end of shift
routes to the filing sheet instead of retrying. End it from the same place.

## Field Capture Cards

Printable from `Desk → Reconcile → Print capture cards` (two per page). The field
order on the card matches the submit flow exactly — record type, category, occurrence
number or temporary reference, date, location, narrative, member, time — so
transcription is mechanical, not judgement.

Keep a stack in each vehicle.

## Reconciliation after an outage

A supervisor works the card stack at `Desk → Reconcile`, oldest first:

1. Enter the card exactly as written; the member on the card becomes the record's
   author, the supervisor is recorded as the transcriber.
2. If the card carries a pre-issued occurrence number, enter it — the system verifies
   it belongs to that member's block and files under it.
3. If the card has only a temporary reference, the system issues the occurrence
   number and the screen shows the temp-ref → occurrence pairing; write it back on
   the paper filing sheet.

Every reconciled record files through the same pipeline as a live submission: same
metadata, same audit, same tracker row.
