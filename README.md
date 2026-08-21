# SN Connect

Records management application for the Squamish Nation Public Safety Department.

A browser-based system where Community Safety Team patrollers and department staff submit
records that file themselves into the correct location — with the right name, metadata, and
permissions. Users never browse the underlying storage and never choose a destination.

## Status

v1 feature-complete against the build brief, running on the mock storage adapter
pending tenant approval. See [docs/DESIGN-PLAN.md](docs/DESIGN-PLAN.md) for the design
decision record; the git history reflects each build checkpoint.

- **Field surface** (phone): shift sign-on ritual, three-tap filing, pending queue,
  pre-issued occurrence numbers, my submissions, end of shift, install walkthrough
- **Desk surface** (desktop): triage queue, records, full record view with audited
  reads, correction-as-supersede, bulk filing, supervisor review with queue-age
  alerts, reconciliation from capture cards, quarterly reports with enforced
  small-cell suppression (on-screen + Council PDF), audit view, admin
- **Fallback**: filing sheet, paper-only mode, Field Capture Card PDF —
  see [docs/FALLBACK.md](docs/FALLBACK.md)
- **Tenant onboarding**: [docs/IT-REQUEST.md](docs/IT-REQUEST.md) (hand to IT),
  [docs/PRIVACY-STATEMENT.md](docs/PRIVACY-STATEMENT.md) (privacy review),
  [docs/BRANDING.md](docs/BRANDING.md) (Nation-supplied assets)

Run the tests with `npm test` (occurrence concurrency, idempotency, tracker
append-only and header drift, suppression, no-content-in-database sweep).

### Dev sign-in

`AUTH_MODE=dev-bypass` presents simulated users, one per role. Real Entra sign-in
activates once the app registration in docs/IT-REQUEST.md exists.

## Stack

- **Next.js (App Router) + TypeScript** — one codebase, two surfaces (Field and Desk)
- **Tailwind CSS** with a custom token layer (no default palette values ship)
- **Prisma** — SQLite for local development, **PostgreSQL in production**. The application
  database stores operational data only: sequences, idempotency keys, audit entries,
  configuration. Never names, narrative, or file content.
- **Microsoft Entra ID** (MSAL, auth code + PKCE) for identity — dev bypass available locally
- **Microsoft Graph** (server-side only, `Sites.Selected`) for SharePoint storage
- Self-hosted variable fonts (Inter Tight, Inter, JetBrains Mono) — no font CDN calls

## Deployment region requirement

This application handles confidential community information. **Production must be deployed
to a Canadian region** (e.g., Azure Canada Central) and confidential content lives only in
the Nation's SharePoint tenant — never in this application's database, logs, or caches.

## Local development

```
npm install
npm run dev
```

Requires Node.js 20+. Configuration lives in `/config` (branding, vocabularies, storage
routing, Excel column mapping) and `.env` (see `.env.example` once available).

## Known platform limitations

- Screenshots cannot be blocked in a browser. This is noted in the acceptable use
  acknowledgement rather than pretended away.
- Browser storage on unmanaged iOS devices can be evicted; the app never claims to be a
  reliable offline capture device. Paper remains the primary capture medium at the scene.
