---
name: Anki Convo
description: A voice-first Anki review client — calm, dark, two signal colors against deep navy.
colors:
  brand-navy: "#0a1730"
  brand-navy-deep: "#060f1e"
  signal-cyan: "#20d0ff"
  signal-cyan-bright: "#58dcff"
  signal-cyan-press: "#11b6e6"
  lime-bright: "#b0f040"
  lime-hover: "#c6f76a"
  lime-press: "#97d62b"
  bg: "#08111f"
  surface: "#102134"
  surface-raised: "#19293f"
  surface-sunken: "#060e1a"
  text-primary: "#eaf1f8"
  text-secondary: "#a4b6cb"
  text-muted: "#6c8097"
  again: "#c0392b"
  hard: "#e67e22"
  good: "#27ae60"
  easy: "#2f8fd6"
typography:
  display:
    fontFamily: "Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "normal"
  headline:
    fontFamily: "Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.15
  title:
    fontFamily: "Poppins, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.09em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
  8: "40px"
  9: "48px"
components:
  button-primary:
    backgroundColor: "{colors.signal-cyan}"
    textColor: "#04222e"
    rounded: "{rounded.md}"
    padding: "0 18px"
  button-primary-hover:
    backgroundColor: "{colors.signal-cyan-bright}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
  card-flashcard:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "48px 40px"
  input-text:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "11px 14px"
---

# Design System: Anki Convo

## 1. Overview

**Creative North Star: "The Night Console"**

Anki Convo's interface is a quiet instrument panel glowing in the dark — the surface a reviewer
watches while talking, not reading. Deep navy fills nearly the whole screen; everything that isn't
navy is either a hairline border holding a surface together or one of exactly two signal colors
doing real work: **Signal Cyan** for the system listening, acting, or focused, and a sparing
**lime** for the moment something is confirmed correct or new. There is no gradient, no texture, no
imagery — depth comes from stacked navy surfaces (`bg` → `surface` → `surface-raised`) and a
0.5px hairline border, not from decoration. This rejects the gamified, mascot-driven, confetti-and-
streak-badge school of language apps, and it rejects the generic cluttered SaaS/edtech dashboard
just as firmly — both push noise into space this system reserves for the next spoken turn.

A full light theme mirrors every token (cyan shifts to a deeper, more saturated `#0c97c4` for
sufficient contrast on white; lime gets a darker ink variant for text use), but dark is the primary,
designed-for mode — the one a person uses with their phone propped up, half-attention on the road or
the dishes.

**Key Characteristics:**
- Flat dark navy surfaces, hairline borders, zero imagery or gradient
- Exactly two signal colors (cyan = active/focus/voice, lime = correct/new) — everything else is
  navy, text, or the inherited Anki grade scale
- Generous, centered single-column layouts (440px setup, 680px review) — never a dashboard grid
- Calm, exponential-ease motion; nothing bounces

## 2. Colors

The palette is sampled directly from the Anki Convo logo: navy book, cyan speech-bolt, lime back
cover. It is dark-first with a full, separately-tuned light theme — never a CSS-filter inversion.

### Primary
- **Signal Cyan** (`#20d0ff`): the one color that means "the system is listening, focused, or
  acting." Primary buttons, focus rings, the voice/recording glow, links. Used sparingly — it reads
  as a signal precisely because it isn't ambient.

### Secondary
- **Lime** (`#b0f040`): confirmation and novelty only — the completion check, "new" indicators,
  positive highlights. Never used as body text on dark surfaces (insufficient contrast); on light
  surfaces it drops to a darker ink variant (`#5f8a12`) when used as text.

### Tertiary
- **SRS Grade Scale** — kept verbatim from Anki so muscle memory transfers: **Again** (`#c0392b`,
  red), **Hard** (`#e67e22`, orange), **Good** (`#27ae60`, green), **Easy** (`#2f8fd6`, blue). Each
  has a `-text` variant tuned per-theme for contrast and a `-soft` tint for badge backgrounds.

### Neutral
- **Deep Navy** (`#0a1730` / `#060f1e` deep): the brand's own neutral, not a generic black —
  everything dark in this system is navy-tinted, never true gray.
- **Background** (`#08111f`): the base canvas in dark mode.
- **Surface** (`#102134`) / **Surface Raised** (`#19293f`) / **Surface Sunken** (`#060e1a`): the
  three-step layering that creates depth without shadows — cards, raised panels (inputs, modals),
  and recessed wells (disabled inputs).
- **Text Primary** (`#eaf1f8`), **Text Secondary** (`#a4b6cb`), **Text Muted** (`#6c8097`): all
  cool, navy-tinted off-whites — never a flat neutral gray.
- **Hairline Border** (`rgba(255,255,255,0.08)`, thickening to `0.16` on hover, `0.26` strong):
  the system's signature line — nearly every surface boundary is this, not a shadow.

### Named Rules
**The Two-Signal Rule.** Only cyan and lime carry meaning. If a third "accent" color appears
anywhere outside the inherited Anki grade scale, it's wrong — route it through an existing role or
leave it navy.

**The No-Gray Rule.** Every neutral in this system — background, surface, text, border — is
navy-tinted. A flat, hue-0 gray anywhere in the UI is an error; it breaks the cool, cohesive dark
field the rest of the palette depends on.

## 3. Typography

**Display Font:** Poppins (with system-ui, -apple-system, 'Segoe UI', sans-serif fallback)
**Body Font:** Plus Jakarta Sans (with the same system fallback stack)
**Label/Mono Font:** JetBrains Mono (with SF Mono, Fira Code, ui-monospace fallback)

**Character:** Poppins' rounded geometric letterforms echo the wordmark and carry headings and the
display scale; Plus Jakarta Sans is the friendly, humanist workhorse for everything a user reads at
length. The pairing is warm-but-precise — never cold-technical, never playful enough to undercut the
calm-coach voice.

### Hierarchy
- **Display** (700, 56px, 1.15 line-height): hero/marketing contexts only, not used inside the
  review session itself.
- **Headline** (600, 30px, 1.15): page-level headings (deck picker title, session summary).
- **Title** (600, 24px, 1.35): screen titles within a flow.
- **Card Prompt** (400, 21px, 1.35, Plus Jakarta Sans): the flashcard's question/answer text — sits
  apart from the heading hierarchy because it's read aloud as much as read, max 46ch width.
- **Body** (400, 15px, 1.5): default body and card text throughout the UI.
- **Label** (600, 11px, 1.2 line-height, 0.09em tracking, uppercase): eyebrow-style tags
  (`FRONT`, `YOUR ANSWER`, `VOICE MODE`) and field labels — the only place uppercase + wide tracking
  appears in this system.

### Named Rules
**The Spoken-Width Rule.** Card prompt text caps at 46ch — wider than the 65–75ch body-copy
guideline, because it's read aloud in a single breath, not scanned as a paragraph.

## 4. Elevation

Flat by default; shadow on lift. Resting surfaces — flashcards, list rows, panels — carry zero
shadow. Their depth comes entirely from the hairline border plus the surface-layering steps
(`bg` → `surface` → `surface-raised`). Shadows exist solely as a response to genuine elevation:
something that floats above the layout (a modal, a dropdown, a bottom sheet) or is actively focused
(the cyan/lime glow rings). All shadows are navy-tinted (`rgba(4,10,20,…)`), never neutral gray or
black — even elevation has the brand's temperature.

### Shadow Vocabulary
- **shadow-xs** (`0 1px 2px rgba(4,10,20,0.3)`): barely-there separation, rarely used alone.
- **shadow-sm** (`0 2px 8px rgba(4,10,20,0.3)`): small floating elements (tooltips, small popovers).
- **shadow-md** (`0 10px 28px rgba(4,10,20,0.42)`): the standard "this is floating above the page"
  shadow — modals, the teaching bottom sheet.
- **shadow-lg** (`0 22px 56px rgba(4,10,20,0.5)`): maximum lift, reserved for the most prominent
  overlays.
- **glow-cyan** / **glow-lime** (`0 0 0 4px rgba(32,208,255,0.18)` / `rgba(176,240,64,0.18)`):
  not elevation in the z-axis sense — a focus/state ring substituting for a hard outline.

### Named Rules
**The Flat-by-Default Rule.** A resting card or row with a shadow is a mistake; the border is
already doing that job. Shadow is reserved for things that genuinely float above the layout.

## 5. Components

Buttons, fields, and cards all read as confident but quiet — solid fills only on the two signal
colors, everything else is border-and-surface.

### Buttons
- **Shape:** 12px radius (`--radius-md`), 0.5px border (transparent unless secondary/ghost/danger).
- **Primary:** Signal Cyan fill (`#20d0ff`), near-black-navy text (`#04222e`) for contrast; hover
  brightens to `#58dcff`, press deepens to `#11b6e6`.
- **Lime variant:** same shape, lime fill, used only where lime's "confirmed/positive" meaning
  applies (e.g. "mark correct").
- **Secondary:** `surface-raised` fill, `text-primary` text, hairline border that strengthens on
  hover — for the second-priority action beside a primary.
- **Ghost:** transparent, `text-secondary`, border-only — tertiary actions.
- **Danger:** transparent fill, `again-text` color, red-tinted border; hover fills with `again-soft`.
- **Hover / Focus:** color/background transitions at 0.16s (`--dur-base`) with the exponential
  `--ease-out` curve; focus-visible gets the cyan glow ring, never a hard outline; active presses
  nudge `translateY(1px)`.
- **Disabled:** `opacity: .5`, cursor `not-allowed`, no transform on press.

### Flashcard (signature component)
The product's defining surface. Flat `surface` background, 0.5px hairline border, 16px radius
(`--radius-lg`), generous 48px/40px padding, centered text up to 46ch wide. A small uppercase
`FRONT`/`BACK` label sits top-left, deck name top-right — both in muted, 11px tracked-caps label
type. Inline `<code>` spans use the mono face on a soft translucent chip with lime-tinted text.
No shadow at rest; this is the clearest expression of the Flat-by-Default Rule.

### Inputs / Fields
- **Style:** `surface-raised` background, 0.5px hairline border, 8px radius (`--radius-sm`),
  11px/14px padding. Uppercase 11px tracked label above the field, muted hint or red error text
  below.
- **Focus:** border shifts to Signal Cyan plus a soft 3px cyan glow ring (`--accent-soft`) —
  never a default browser outline.
- **Error:** border and glow shift to the `again` red; error text uses `again-text`.
- **Disabled:** `opacity: .6`, background drops to `surface-sunken` (the recessed-well neutral).

### Record Button (signature component)
The session's primary control. Fully round (pill radius), pulses red while actively recording and
cyan while listening — the system's two signature animated loops, both respecting
`prefers-reduced-motion` with a static-state fallback.

### Cards / Containers
- **Corner Style:** 16px (`--radius-lg`) for cards and modals; 20px (`--radius-xl`) for bottom
  sheets; 12px (`--radius-md`) for smaller panels/rows.
- **Background:** `surface`, occasionally `surface-raised` for nested-but-distinct panels (avoid
  nesting more than one level).
- **Shadow Strategy:** none at rest — see Elevation. Floating cards (modals, sheets) use
  `shadow-md`.
- **Border:** 0.5px hairline at `--border`, brightening on hover.
- **Internal Padding:** 40–48px for the flashcard; 16–24px for standard panels.

### Grade Picker
Surfaces the Again/Hard/Good/Easy scale as four equal controls in the inherited grade colors —
the one place four colors appear at once, justified because it's a direct, intentional borrowing of
Anki's own muscle-memory palette, not a new accent.

## 6. Do's and Don'ts

### Do:
- **Do** keep every neutral — background, surface, text, border — navy-tinted; no hue-0 gray.
- **Do** reserve Signal Cyan for listening/acting/focus and lime for confirmed/positive/new; nothing
  else gets a third accent color.
- **Do** use the 0.5px hairline border as the default way surfaces separate from the navy field
  behind them — borders carry resting surfaces, not shadows.
- **Do** keep the Again/Hard/Good/Easy grade scale and its exact colors verbatim from Anki.
- **Do** use the cyan glow ring (`0 0 0 4px rgba(32,208,255,.18)`) for focus states, never a hard
  default outline.
- **Do** ease motion out with the exponential `--ease-out` curve (120–280ms) and provide a
  `prefers-reduced-motion` fallback for the record-button pulse and grading spinner.

### Don't:
- **Don't** add shadows to resting cards, rows, or panels — that's what the hairline border is for.
- **Don't** introduce a gamified, mascot-driven, Duolingo-style register: no streak badges, no
  confetti, no cutesy illustration carrying tone (per PRODUCT.md's anti-references).
- **Don't** build a generic, cluttered SaaS/edtech dashboard layout — this is a single centered
  column (440px or 680px), not a multi-panel grid.
- **Don't** use gradients, photography, or texture anywhere; depth comes from navy surface layering
  only.
- **Don't** put lime as body text on a dark surface — it fails contrast; use `--lime-ink` contexts
  or keep lime to fills/highlights only.
- **Don't** use bounce or elastic easing on any transition — every curve in this system is
  exponential ease-out, calm and quiet to match the coach voice.
