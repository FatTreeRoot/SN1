# SN Connect

Records management application for the Squamish Nation Public Safety Department.

A browser-based system where Community Safety Team patrollers and department staff submit
records that file themselves into the correct location — with the right name, metadata, and
permissions. Users never browse the underlying storage and never choose a destination.

## Status

In active development. See [docs/DESIGN-PLAN.md](docs/DESIGN-PLAN.md) for the design
decision record. Build proceeds in checkpoints; the git history reflects each one.

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
