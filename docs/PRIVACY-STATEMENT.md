# SN Connect — where data lives

*Written for a privacy impact assessment. Statements here are enforced in code and
verified by automated tests where noted.*

## The principle

Confidential community information exists in exactly two places: transiently on the
device where it is captured, and in the Squamish Nation's SharePoint tenant. It is
never stored anywhere the application operates.

## What each store holds

### The Nation's SharePoint tenant (system of record)

All record content: narratives, photographs, documents, emails, scans, and the
metadata describing them (occurrence number, type, category, area, location,
submitting staff member, shift context, sensitivity, retention class). Three sites
segregate confidentiality tiers; the application identity can write only to those
three sites (`Sites.Selected`), granted explicitly by the Nation's administrators.

### The application database (operational data only)

- Occurrence number sequences and pre-issued blocks
- Idempotency keys (client-generated UUIDs and result pointers)
- Sessions, device tokens, staff identity (name, email, directory id)
- Append-only audit entries: who, when, what action, which record type, which item
  id — **never what a record says**
- Configuration (thresholds, vocabulary settings) and pending-work pointers
  (item id + occurrence number)

An automated test files a record with a known narrative string and then sweeps every
database table asserting the string appears nowhere (`tests/filing.test.ts`).

### The capturing device (transient)

Items captured without signal wait in browser storage **only until the server
acknowledges them**, then are purged immediately. No history, no thumbnails, no
drafts. Persistent storage is requested from the browser as mitigation against
eviction, not treated as a guarantee; paper remains the primary capture medium at the
scene. Browser storage on an unmanaged phone cannot be meaningfully encrypted at rest
by a web application — the mitigation is minimal retention, stated honestly, rather
than a claim of encryption.

### Nowhere else

- Uploads stream through the server in memory into SharePoint upload sessions; request
  bodies are never written to server disk.
- Logs, error messages, and notifications carry occurrence numbers and links, never
  names, addresses, or narrative. Database query logging is disabled.
- No third-party observability, analytics, or font/CDN services — no request leaves
  for any third party. Fonts ship with the application.
- Reports aggregate metadata in memory, render, file the output back to SharePoint,
  and discard the working set. Narrative never enters the reporting path.

## Protections on outputs

Quarterly reports enforce **small-cell suppression in code**: counts below a
configurable threshold (default 5) are combined upward or withheld with a visible
footnote, because a count of two incidents in a named location can be identifying in
a small community. A withheld value is visibly "withheld", never rendered as zero.
Suppression logic carries unit tests (`tests/suppress.test.ts`).

## Access

- Roles come from the Nation's security groups, resolved server-side on every
  request; removal from a group takes effect on the member's next request.
- Reading a record's narrative is possible only on the Desk surface, only for roles
  granted it, and every read is written to the append-only audit log.
- The call-centre identity can submit intake and read nothing.
- The Field surface (personal phones) can never export, run reports, or display full
  narrative, regardless of the signed-in user's role.

## Honest limitations

- Screenshots cannot be blocked in a browser. The acceptable-use acknowledgement,
  recorded at first sign-in, states this and prohibits capture.
- Records are append-only: corrections supersede earlier versions rather than editing
  them, preserving a complete history in the Nation's tenant. Disposition follows the
  retention class stamped on every record, executed within SharePoint.
- The application is hosted in a Canadian region; operational data does not leave
  Canada.
