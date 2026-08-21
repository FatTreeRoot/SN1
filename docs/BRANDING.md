# SN Connect — supplying the Nation's brand

No cultural artwork, form, or motif in this application is generated or approximated.
Everything visual that belongs to the Nation arrives from the Nation through this
document, and drops in without a developer.

## What to supply

| Asset | Format | Size | Where it appears |
|---|---|---|---|
| Logo on light backgrounds | SVG preferred (or PNG ≥ 600px wide) | 3:1 aspect ratio | Sign-in, Desk header, report PDF header |
| Logo on dark backgrounds | SVG preferred (or PNG ≥ 600px wide) | 3:1 aspect ratio | Field surface at night, dark theme |
| Compact mark | SVG or PNG ≥ 192×192 | Square | Mobile header, home-screen icon, browser tab |

Place the files in `public/brand/` and set their paths in **`config/branding.ts`**
(`logo.light`, `logo.dark`, `logo.compact`). Until then, a clearly marked neutral
placeholder holds each spot at the correct size.

## Colours

The palette currently in the application is a **working approximation sampled from
squamish.net** and is marked provisional. When the brand standards document is
available, replace the values in `config/branding.ts` — every colour in the
application, including the report PDF, resolves through that single file.

One design rule will be preserved regardless of palette: **red is reserved for
escalation, urgent status, and destructive confirmations.** In a safety application,
red must keep its meaning; the everyday interface takes its colour from the other
brand hues.

## Language

Interface strings live in `config/strings.ts`, each with room for a
Sḵwx̱wú7mesh sníchim value supplied by the Nation (`sn:`). Nothing is invented or
machine-translated; supplied terms render exactly as provided.
