# SN Connect — Design Plan (Checkpoint 1)

Records management for the Squamish Nation Public Safety Department. This document is the
design decision record required before any code: what we would have defaulted to, what we
chose instead, and why. Reviewed against the build brief in full.

---

## 1. The register

Two people have to trust this application: a Council member reading a quarterly report in a
boardroom, and a patroller filing a call for service one-handed in a vehicle at 0300. The
design register that serves both is **calm, solid, institutional** — nothing decorative
competing for attention, one deliberate moment of character (the shift sign-on screen), and
discipline everywhere else.

**Default we rejected:** the generic dashboard aesthetic — cards with drop shadows, a blue
accent, badge counters, spinners. It reads as template, and the brief explicitly fails a
deliverable that could be mistaken for one.

**What we chose:** a quiet surface built from the Nation's own colours and from landscape
abstraction (horizon, water, stone), with typography doing most of the visual work.

## 2. Cultural boundary — the governing constraint

No Coast Salish or Indigenous art, form lines, ovoids, crescents, or motifs are generated,
imitated, approximated, or "inspired by" anywhere in this application. Not in the login
animation, icons, textures, loading states, or empty states. Any cultural artwork arrives
from the Nation and drops into placeholders we provide (`BrandMark`, report headers).

Where the interface needs visual character it draws from **landscape and material**: horizon
bands, water gradients, river-stone neutrals, the light difference between a day shift and a
night shift. Abstract and geometric only. This is treated as the correct answer, not a
limitation.

## 3. Palette

**Source:** sampled from the Nation's live web presence (squamish.net, August 2026) rather
than invented. Provisional until the Nation's brand standards document arrives — every value
is a CSS custom property in one tokens file (`config/branding.ts`) so the whole palette swaps
in one place.

The Nation's brand is **red-forward**: cedar red `#db2419` / `#c8102e` dominates their site,
with near-black `#231f20`, an ocean teal `#3d98a2`, an ochre gold `#d79023`, warm sand
`#dbd5cd`, and cool grays.

**The tension:** in a safety application, red means escalation. Using the Nation's primary
brand colour as a general accent would make every hover state look like an emergency.

**Resolution — the everyday interface is carried by charcoal, teal, and sand; the brand red
is reserved:**

| Role | Colour | Use |
|---|---|---|
| Ink / structure | `#231f20` charcoal | Text, headers, dark-theme base |
| Working accent | `#3d98a2` teal → deepened ramp | Interactive elements, focus, selection, links |
| Warmth | `#dbd5cd` sand / stone grays | Backgrounds, cards, dividers |
| **Reserved: escalation** | `#c8102e` / `#db2419` red | Urgent status, escalation flags, destructive confirmations — and the Nation's own brand contexts (BrandMark surround). Never hover states, never decoration. |
| Status: pending | `#d79023` ochre | Pending/unfiled — warm, patient, not alarming |
| Status: filed | deep green `#2E7D52` | Confirmed filed |

The teal earns the "working accent" role because it is the Nation's own secondary colour and
it reads as inlet water — on brand, on landscape, and unambiguous next to the reserved red.

**Themes.** Both surfaces ship light and dark, user-togglable (a client decision that
supersedes the brief's night-only Field rule). Field **defaults to dark**: deep desaturated
charcoal-teal base, no large light surfaces, high-contrast type — a full white screen at 0300
destroys night vision. Desk defaults to light and follows system preference. Dark theme is a
first-class palette (tuned contrast ramps), not an inversion filter.

## 4. Typography

Three faces, all open-licence variable fonts, **self-hosted** — no font CDN calls, because the
outbound-data constraint applies to typography too.

| Role | Face | Why |
|---|---|---|
| Display & headings | **Inter Tight** | Disciplined grotesque, tight apertures, institutional without being cold. |
| Body & interface | **Inter** | Maximum legibility, seamless pairing. Nothing below 16px on Field; body 17–18px. |
| Data & occurrence numbers | **JetBrains Mono** | Slashed zero, unambiguous 1/l/I — occurrence numbers are read over radio and written on paper in the rain. |

Sentence case throughout. No all-caps except small utility labels. A real modular scale
(1.250 ratio, anchored at 17px body on Field) defined once in the token file.

**Default we rejected:** system font stack (invisible, but characterless) and Space Grotesk
(distinctive, but tips toward startup).

## 5. Layout concept

**Field (360px-first, one-handed, gloved):**
- One column, full-width tiles, primary actions in the bottom half of the screen (thumb zone).
- Home is a grid of large icon-led record-type tiles — the entire mental model of the app is
  "tap what kind of thing you have."
- The pending state is a full-width coloured banner (`1 item not yet filed`), breathing slowly
  in ochre — never a badge, never a spinner, never red.
- Shift context (vehicle, area, partner) sits quietly in a header strip; it is set once at
  sign-on and inherited by every submission.
- Three taps to capture: record type → category → capture. Four fields maximum, all defaulted.

**Desk (desktop, comfortable working density):**
- Left rail navigation, content area with 15–20-row tables, compact filters, calm headers.
- Same tokens, same voice, light default. Dense enough for real triage work without becoming
  a spreadsheet.

## 6. The signature element — shift sign-on

The one screen allowed to spend boldness, and it earns it: every patroller sees it at the
start of every shift, and it is the screen that removes four fields from everything that
follows.

**Concept: signing on, not filling in.** A full-bleed screen. A horizon gradient — layered
bands in charcoal, teal, and sand — sits behind everything, its light keyed to the actual
shift start time: pre-dawn dark for a night shift, soft daylight for a day shift. The
member's name and shift time set large and calm at the top. Three choices — vehicle, area,
partner — each one tap, each choice assembling visibly into a shift summary line as it is
made. One confirming action: **Start shift**. On confirm, the horizon settles upward and
becomes the application header — the ritual becomes the interface.

The vehicle walkaround (optional photo + damage note) hangs off the vehicle choice, so the
fleet check requirement is satisfied inside the ritual rather than as a separate chore.

## 7. Motion

Sparse, purposeful, GPU-friendly, and `prefers-reduced-motion` gets **real reduced variants**
(instant state changes with the same information), not disabled animation.

- **Login animation:** layered horizon bands in the primary ramp drifting at different rates —
  weather, not animation. Sixty-second loop, low amplitude, no bounce/particles/parallax.
  Paused when the tab is hidden. On successful auth the bands resolve upward into the header.
  CSS-only implementation.
- **Tile press:** firm immediate depress, short settle, no spring overshoot.
- **Submit:** the occurrence number counts into place, then the confirmation card lifts —
  definite, because this is the moment the patroller needs to trust.
- **Pending banner:** slow breathing pulse in ochre. Patient, not alarming.
- **Queue drain:** items check off in sequence with a short stagger.
- **Escalation:** one decisive shift to red plus a haptic pulse where supported. Fires once,
  stays. No loop.

## 8. Voice

Every string written deliberately, held in one strings file (with a hook for Nation-supplied
Sḵwx̱wú7mesh sníchim terms to drop in via configuration — nothing invented, ever).

- Plain verbs, sentence case, no filler, no exclamation marks.
- Named by what the patroller controls: `Not yet filed`, never `Sync queue pending`.
- Actions keep their name: the button says `File it`, the confirmation says `Filed`.
- Errors say what happened and what to do next; they never apologise.
- Empty states invite an action.

## 9. BrandMark placeholder

A `<BrandMark />` component reads its asset paths from `config/branding.ts`. Until the Nation
supplies assets it renders a bounded stone-tone box reading `Squamish Nation logo` at the
correct aspect ratio, in light/dark/compact variants. Used on sign-in, the app header, report
PDF headers, and the install walkthrough. Required dimensions and formats documented in
`docs/BRANDING.md` so the client can supply assets without a developer.

## 10. Defaults vs. choices — summary

| Where a default existed | What we chose instead | Why |
|---|---|---|
| Dashboard-blue accent | Nation teal, from their own site | On brand, unambiguous next to reserved red |
| Brand red as primary accent | Red reserved for escalation only | Safety semantics outrank brand prominence |
| Invented palette | Sampled from squamish.net, tokenised | Grounded now, swappable when the brand guide arrives |
| System fonts / trendy grotesque | Inter Tight + Inter + JetBrains Mono, self-hosted | Institutional register, radio-legible numbers, no third-party calls |
| Night-only Field theme (brief) | Light + dark on both surfaces, Field defaults dark | Client decision; night-vision protection kept as the default |
| Spinner/badge for pending | Breathing full-width ochre banner | Visible from arm's length, patient not alarming |
| Generic login screen | Horizon-band ambient animation resolving into the header | Landscape abstraction, inside the cultural boundary |
| Decorative iconography | Geometric, abstract icon set only | Cultural boundary is absolute |

---

## Addendum — client direction on colour (August 2026)

The client directed that the whole application carry the Nation's colours and design
style, superseding §3's resolution that kept red reserved. The regenerated palette
puts **cedar red in charge of the interface** — primary actions, navigation, focus,
the brand rule that tops every page, and the report chrome — as it leads on
squamish.net. To keep safety semantics legible:

- **Escalation and destructive actions use the brighter urgent red** with filled
  card/button treatments and iconography, so urgency still reads apart from ordinary
  interaction.
- **Teal moves to a supporting role** as the water hue: the horizon backdrop, and
  informational accents.
- Pending stays ochre; filed stays green; the status vocabulary is unchanged.
- The dawn/dusk horizon gains a low cedar-red glow — the one place brand red appears
  as landscape rather than action.

All of this remains a token-file change (`config/branding.ts`); the brand-standards
swap procedure in BRANDING.md is unchanged.

*Next checkpoint: design system and tokens — the token file, BrandMark, type scale, core
components, both themes, and a static demonstration page.*
