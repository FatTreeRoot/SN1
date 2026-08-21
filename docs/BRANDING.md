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
(`suppliedLogoFiles`). Until then, a clearly marked neutral placeholder holds each
spot at the correct size.

### Turning the artwork on and off

One line in `config/branding.ts` controls every place the logo appears — sign-in,
headers, the report PDF header, the browser tab, and the home-screen icon:

```ts
export const useSuppliedLogo: boolean = true;  // false → neutral placeholder everywhere
```

The asset files stay in `public/brand/` either way, so this is a one-line round trip
in both directions. Useful for showing the app to people outside the Nation before
artwork approval is final, or for a screenshot that should not carry the mark.

## Colours

The palette currently in the application is a **working approximation sampled from
squamish.net** and is marked provisional. When the brand standards document is
available, replace the values in `config/branding.ts` — every colour in the
application, including the report PDF, resolves through that single file.

Per the department's direction, the Nation's **cedar red leads the interface** —
primary actions, navigation, and the brand rule on every page — matching
squamish.net. Escalation and destructive actions use the brighter urgent red with
filled treatments and iconography so urgent things still read as urgent. If the brand
standards document prefers a different balance, both are single-value changes in
`config/branding.ts` (`accent` and `urgent`).

## Language

Interface strings live in `config/strings.ts`, each with room for a
Sḵwx̱wú7mesh sníchim value supplied by the Nation (`sn:`). Nothing is invented or
machine-translated; supplied terms render exactly as provided.
