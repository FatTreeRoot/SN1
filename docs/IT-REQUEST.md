# SN Connect — request to Information Technology

**From:** Public Safety Department
**Re:** Application registration and SharePoint access for the department's records
application (SN Connect)
**Action requested:** the six numbered items below.

SN Connect is a records management application for the Public Safety Department. Staff
sign in with their existing Nation accounts; records file into department SharePoint
sites under an application identity. Confidential content lives only in the Nation's
tenant — the application's own database holds no record content of any kind.

## 1. Application registration (Microsoft Entra ID)

Create one app registration:

| Setting | Value |
|---|---|
| Name | `SN-Connect` |
| Supported account types | Single tenant |
| Redirect URI (web) | `https://[CONFIRM: production hostname]/api/auth/callback` |
| Client secret | Issued to the deployment environment only; rotate on your standard cycle |

## 2. API permissions — please read before granting

The application requests **`Sites.Selected` (Application)** — *not* `Sites.ReadWrite.All`.

`Sites.Selected` grants access to **nothing** by default. After admin consent, an
administrator explicitly grants the application **write** access to exactly three sites
(section 3) and nothing else in the tenant. This is the least-privilege pattern
Microsoft recommends for application access to SharePoint.

Delegated sign-in permissions: `openid`, `profile`, `email` (standard sign-in claims
only).

## 3. SharePoint sites

Three sites, by confidentiality tier. Grant the app registration `write` on each via
the Sites.Selected permission grant:

| Site | Purpose | Libraries |
|---|---|---|
| `PS-Operations` | Standard operational records | Fleet Checks, Shift Reports, Quarterly Reports |
| `PS-Confidential` | Confidential records | Calls for Service, Escalation Reports, Community Emails, Call Centre Intake |
| `PS-Restricted` | Restricted records | Notebook Scans, Flagged Sensitive |

Each library needs the metadata columns listed in the application's storage
documentation (single-line text unless noted): RecordTypeId, RecordTypeCode,
RecordTypeName, RecordDate, OccurrenceNumber, CategoryId, CategoryName, AreaId,
AreaName, LocationId, LocationName, SubmittedByOid, SubmittedByName, AuthorOid,
AuthorName, ShiftId, VehicleId, VehicleName, Sensitivity, RetentionClass, Status,
Supersedes, CapturedAt, SyncedAt, ClockDivergenceFlagged (yes/no), IdempotencyKey.

**Please index** OccurrenceNumber, RecordDate, SubmittedByOid, and RecordTypeId at
creation time — SharePoint list views degrade past 5,000 items without indexes, and
these libraries will exceed that.

## 4. Security groups

Five groups, mapped to application roles. Group membership is the only authorisation
source; the application re-resolves it on every request, so removing a member takes
effect immediately.

| Group | Who belongs |
|---|---|
| `PS-Members` | Community Safety Team patrollers |
| `PS-Supervisors` | Shift supervisors |
| `PS-Managers` | Department manager and delegates |
| `PS-CallCentre` | Call centre service identity (submit-only, no read access) |
| `PS-Admins` | Application configuration administrators |

Provide the five group object IDs to the deployment configuration.

## 5. Excel tracker — one-time change

The department's incident tracker workbook needs its data range converted to a **named
Excel table** (Insert → Table, then name it `IncidentTracker` on the Table Design tab).
The application appends rows through the Graph workbook API and never modifies existing
rows; a named table is what makes structured appends possible. Nothing else about the
workbook changes.

## 6. Hosting and licensing questions

- The application must be hosted in a **Canadian region** (e.g., Azure Canada Central:
  App Service or Container Apps, plus a managed PostgreSQL instance for operational
  data only). Is there an existing Nation Azure subscription this should live in?
- No additional Microsoft licensing is expected: staff use existing accounts, and the
  application identity uses the app registration. Please confirm the call-centre
  service identity can be a group-assigned application account rather than a licensed
  user.
- The automated call-centre email flow will run inside the tenant via Power Automate
  and call the application's intake endpoint; it needs a Power Automate licence
  context. Whom should we coordinate with?

## Notes

- No `Sites.Read.All`, no `Mail.*`, no `User.Read.All` are requested — the application
  reads nothing tenant-wide.
- Session security: three concurrent devices per user, MFA gated by signed device
  token, Field sessions expire at end of shift; all enforced application-side on top
  of Entra sign-in.
- A scheduled health probe verifies the three site grants stay intact and alerts the
  department if a grant or library changes.
