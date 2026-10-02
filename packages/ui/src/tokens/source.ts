// The token SOURCE — the single truth `scripts/generate-tokens.ts` renders into `src/tokens.css`
// (PD-4, phase 53). Values are live formulas (`oklch(… var(--acc-h))`, `calc()`, `color-mix()`), so
// this stays a TS object of STRINGS emitted verbatim rather than a token-pipeline schema — a
// generator, not a compiler.
//
// Two halves, and the line between them is the whole point of this phase (ADR-039):
//
//   CLOSED (GLOBAL — geometry & rhythm): `GEOMETRY` below, mirrored into `CLOSED_TOKENS`'s CSS
//   custom-property NAMES. An app may read these; `assertNoGlobalOverride` (./check.ts) refuses
//   any app that redeclares one. Minted from astrobot's real constants — `app/use-page-state.ts`'s
//   `LEFT_*`/`RIGHT_*`/`ICON_RAIL` and the 11 `h-[60px]` literals — because that IS the geometry in
//   daily use, not an invented number.
//
//   OPEN (IDENTITY — everything that renders as a colour, a radius, a font): `THEME`/`ROOT`/`DARK`
//   below. Defaults are astrobot's own values, copied value-for-value from
//   `astrobot/console/app/globals.css` (PD-1: the design authority is the software in daily use) —
//   any app may re-declare any of these, freely, per PD-3.
//
// PD-1 — token NAMES are astrobot's (`--acc-h`, `--bubble-user`, `--situation-*`, …) plus the names
// astro-ui already added (`--panel`, `--faint`, `--bubble-in`/`--bubble-out`, `--z-*`), with
// `--bubble-agent`/`--bubble-user` kept as ALIASES of `--bubble-in`/`--bubble-out`. astro-ui's own
// `.astrocode/CONVENTIONS.md` naming table is superseded for this phase — see t18/DECISIONS.md.

/** The CLOSED set as NUMBERS — the JS mirror an app reads instead of a magic literal
 *  (`use-page-state.ts`, `useNarrowViewport`, …). ONE test (`tokens.test.ts`) owns the agreement
 *  between this object and the generated `--*` declarations below (ADR-0047: asserted twice,
 *  checked once). */
/** A dimension token reads as `number`, never as the literal it happens to hold today.
 *  `as const` below keeps the OBJECT shape closed — which is the point (ADR-039: an app may
 *  not add or move a geometry value) — but without this annotation every number would also
 *  narrow to a literal type, and a consumer doing the obvious thing breaks:
 *  `useState(GEOMETRY.leftRail.defaultPx)` infers `useState<300>` and then refuses every
 *  computed width. That happened in astrobot the moment it adopted these (three tsc errors
 *  no gate caught, because Vite's build does not typecheck). CLOSED is about who may change
 *  a value, not about what type it has. */
type Px = number
type GeometryShape = {
  appHeaderPx: Px
  iconRailPx: Px
  leftRail: { minPx: Px; maxPx: Px; snapPx: Px; defaultPx: Px }
  rightRail: { minPx: Px; maxPx: Px; snapPx: Px; defaultPx: Px }
  narrowMaxPx: Px
  z: Readonly<Record<"base" | "raised" | "sticky" | "scrim" | "modal" | "dropdown" | "toast", number>>
  spacingRem: number
  radiusScale: Readonly<Record<"sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl", number>>
}

export const GEOMETRY: Readonly<GeometryShape> = {
  appHeaderPx: 60,
  iconRailPx: 92,
  leftRail: { minPx: 240, maxPx: 480, snapPx: 200, defaultPx: 300 },
  rightRail: { minPx: 240, maxPx: 460, snapPx: 200, defaultPx: 340 },
  narrowMaxPx: 767,
  z: { base: 0, raised: 10, sticky: 20, scrim: 1100, modal: 1200, dropdown: 1250, toast: 1300 },
  spacingRem: 0.25,
  // the RADIUS SCALE is rhythm (closed); `--radius` itself is identity (open, per app).
  radiusScale: { sm: 0.6, md: 0.8, lg: 1, xl: 1.4, "2xl": 1.8, "3xl": 2.2, "4xl": 2.6 },
} as const

/** Every CSS custom-property NAME an app may not redeclare — the refusal list `check.ts` enforces. */
export const CLOSED_TOKENS = [
  "--app-header-h",
  "--rail-icon-w",
  "--rail-left-min",
  "--rail-left-max",
  "--rail-left-snap",
  "--rail-left-default",
  "--rail-right-min",
  "--rail-right-max",
  "--rail-right-snap",
  "--rail-right-default",
  "--breakpoint-narrow",
  "--z-base",
  "--z-raised",
  "--z-sticky",
  "--z-scrim",
  "--z-modal",
  "--z-dropdown",
  "--z-toast",
  "--spacing",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--radius-2xl",
  "--radius-3xl",
  "--radius-4xl",
] as const

const radius = (scale: number) => `calc(var(--radius) * ${scale})`

/** `@theme inline { … }` — Tailwind utility wiring. Closed: the radius SCALE + `--spacing`.
 *  Open: every `--color-*`/font mapping, the UNION of astrobot's and astro-ui's tables
 *  (`--color-ring: var(--ring)` per PD-1, not astro-ui's old `var(--primary)`). Fonts point at the
 *  identity knobs (`--font-family-sans/mono`, set in `ROOT`) so typography is one knob per app. */
export const THEME: readonly string[] = [
  "--color-background: var(--background);",
  "--color-foreground: var(--foreground);",
  "--color-card: var(--card);",
  "--color-card-foreground: var(--card-foreground);",
  "--color-popover: var(--popover);",
  "--color-popover-foreground: var(--popover-foreground);",
  "--color-primary: var(--primary);",
  "--color-primary-foreground: var(--primary-foreground);",
  "--color-secondary: var(--secondary);",
  "--color-secondary-foreground: var(--secondary-foreground);",
  "--color-muted: var(--muted);",
  "--color-muted-foreground: var(--muted-foreground);",
  "--color-accent: var(--accent);",
  "--color-accent-foreground: var(--accent-foreground);",
  "--color-destructive: var(--destructive);",
  "--color-warn: var(--warn);",
  "--color-ok: var(--ok);",
  "--color-border: var(--border);",
  "--color-border-soft: var(--border-soft);",
  "--color-border-strong: var(--border-strong);",
  "--color-input: var(--input);",
  "--color-ring: var(--ring);",
  "--color-panel: var(--panel);",
  "--color-panel-2: var(--panel-2);",
  "--color-faint: var(--faint);",
  "--color-bubble-in: var(--bubble-in);",
  "--color-bubble-out: var(--bubble-out);",
  "--color-bubble-out-foreground: var(--bubble-out-foreground);",
  "--color-chart-1: var(--chart-1);",
  "--color-chart-2: var(--chart-2);",
  "--color-chart-3: var(--chart-3);",
  "--color-chart-4: var(--chart-4);",
  "--color-chart-5: var(--chart-5);",
  "--color-sidebar: var(--sidebar);",
  "--color-sidebar-foreground: var(--sidebar-foreground);",
  "--color-sidebar-primary: var(--sidebar-primary);",
  "--color-sidebar-primary-foreground: var(--sidebar-primary-foreground);",
  "--color-sidebar-accent: var(--sidebar-accent);",
  "--color-sidebar-accent-foreground: var(--sidebar-accent-foreground);",
  "--color-sidebar-border: var(--sidebar-border);",
  "--color-sidebar-ring: var(--sidebar-ring);",
  "--font-sans: var(--font-family-sans);",
  "--font-mono: var(--font-family-mono);",
  "--font-heading: var(--font-sans);",
  `--radius-sm: ${radius(GEOMETRY.radiusScale.sm)};`,
  `--radius-md: ${radius(GEOMETRY.radiusScale.md)};`,
  `--radius-lg: ${radius(GEOMETRY.radiusScale.lg)};`,
  `--radius-xl: ${radius(GEOMETRY.radiusScale.xl)};`,
  `--radius-2xl: ${radius(GEOMETRY.radiusScale["2xl"])};`,
  `--radius-3xl: ${radius(GEOMETRY.radiusScale["3xl"])};`,
  `--radius-4xl: ${radius(GEOMETRY.radiusScale["4xl"])};`,
]

/** `:root { … }` — the CLOSED geometry (from `GEOMETRY`, byte-checked by `tokens.test.ts`) followed
 *  by every OPEN identity default, copied value-for-value from astrobot's `app/globals.css` (the
 *  design authority) plus astro-ui's own extra names (PD-3). Default identity = astrobot's Ice. */
export const ROOT: readonly string[] = [
  "color-scheme: light dark;",
  `--app-header-h: ${GEOMETRY.appHeaderPx}px;`,
  `--rail-icon-w: ${GEOMETRY.iconRailPx}px;`,
  `--rail-left-min: ${GEOMETRY.leftRail.minPx}px;`,
  `--rail-left-max: ${GEOMETRY.leftRail.maxPx}px;`,
  `--rail-left-snap: ${GEOMETRY.leftRail.snapPx}px;`,
  `--rail-left-default: ${GEOMETRY.leftRail.defaultPx}px;`,
  `--rail-right-min: ${GEOMETRY.rightRail.minPx}px;`,
  `--rail-right-max: ${GEOMETRY.rightRail.maxPx}px;`,
  `--rail-right-snap: ${GEOMETRY.rightRail.snapPx}px;`,
  `--rail-right-default: ${GEOMETRY.rightRail.defaultPx}px;`,
  `--breakpoint-narrow: ${GEOMETRY.narrowMaxPx}px;`,
  `--z-base: ${GEOMETRY.z.base};`,
  `--z-raised: ${GEOMETRY.z.raised};`,
  `--z-sticky: ${GEOMETRY.z.sticky};`,
  `--z-scrim: ${GEOMETRY.z.scrim};`,
  `--z-modal: ${GEOMETRY.z.modal};`,
  `--z-dropdown: ${GEOMETRY.z.dropdown};`,
  `--z-toast: ${GEOMETRY.z.toast};`,
  `--spacing: ${GEOMETRY.spacingRem}rem;`,

  // ── IDENTITY (open) — the one accent knob (see astrobot globals.css) ──
  "--acc-h: 226;",
  "--acc-c: 0.11;",
  "--radius: 0.625rem;",
  '--font-family-sans: "Geist", system-ui, -apple-system, "Segoe UI", sans-serif;',
  '--font-family-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;',

  "--background: oklch(0.99 0.004 var(--acc-h));",
  "--foreground: oklch(0.22 0.012 var(--acc-h));",
  "--card: oklch(1 0 0);",
  "--card-foreground: oklch(0.22 0.012 var(--acc-h));",
  "--popover: oklch(1 0 0);",
  "--popover-foreground: oklch(0.22 0.012 var(--acc-h));",
  "--primary: oklch(0.52 var(--acc-c) var(--acc-h));",
  "--primary-foreground: oklch(0.99 0 0);",
  "--secondary: oklch(0.955 0.008 var(--acc-h));",
  "--secondary-foreground: oklch(0.28 0.012 var(--acc-h));",
  "--muted: oklch(0.955 0.008 var(--acc-h));",
  "--muted-foreground: oklch(0.50 0.014 var(--acc-h));",
  "--accent: oklch(0.93 0.016 var(--acc-h));",
  "--accent-foreground: oklch(0.26 0.012 var(--acc-h));",
  "--destructive: oklch(0.58 0.22 25);",
  "--warn: oklch(0.62 0.15 70);",
  "--ok: oklch(0.55 0.14 155);",
  "--border: oklch(0.30 0.02 var(--acc-h) / 12%);",
  "--input: oklch(0.30 0.02 var(--acc-h) / 16%);",
  "--ring: oklch(0.56 var(--acc-c) var(--acc-h));",
  "--chart-1: oklch(0.56 var(--acc-c) var(--acc-h));",
  "--chart-2: oklch(0.62 0.10 200);",
  "--chart-3: oklch(0.58 0.12 160);",
  "--chart-4: oklch(0.66 0.13 85);",
  "--chart-5: oklch(0.60 0.15 25);",
  "--sidebar: oklch(0.97 0.008 var(--acc-h));",
  "--sidebar-foreground: oklch(0.22 0.012 var(--acc-h));",
  "--sidebar-primary: oklch(0.56 var(--acc-c) var(--acc-h));",
  "--sidebar-primary-foreground: oklch(0.99 0 0);",
  "--sidebar-accent: oklch(0.93 0.016 var(--acc-h));",
  "--sidebar-accent-foreground: oklch(0.26 0.012 var(--acc-h));",
  "--sidebar-border: oklch(0.30 0.02 var(--acc-h) / 10%);",
  "--sidebar-ring: oklch(0.56 var(--acc-c) var(--acc-h));",

  "--panel: oklch(0.975 0.006 var(--acc-h));",
  "--panel-2: oklch(0.955 0.008 var(--acc-h));",
  "--faint: oklch(0.54 0.014 var(--acc-h));",
  "--border-soft: oklch(0.30 0.02 var(--acc-h) / 8%);",
  "--border-strong: oklch(0.30 0.02 var(--acc-h) / 22%);",
  "--accent-solid: oklch(0.50 var(--acc-c) var(--acc-h));",
  "--accent-ink: oklch(0.42 var(--acc-c) var(--acc-h));",
  "--code-bg: oklch(0.90 calc(var(--acc-c) * 0.35) var(--acc-h));",
  "--channel-ink: oklch(0.16 0.02 240);",
  "--metal-ring: oklch(0.965 0.008 var(--acc-h));",
  "--wa: #2bb673;",
  "--tg: #2196d6;",
  "--slack: #9b5bc4;",
  "--mail: #d18e1e;",
  "--teams: #5b63d8;",
  "--cu: #c85a92;",
  "--green: #22a865;",
  "--amber: #d18e1e;",
  "--acc-dim: color-mix(in oklch, var(--primary) 12%, transparent);",
  "--acc-line: color-mix(in oklch, var(--primary) 30%, transparent);",

  "--bubble-in: oklch(0.955 0.01 var(--acc-h));",
  "--bubble-out: oklch(0.50 var(--acc-c) var(--acc-h));",
  "--bubble-out-foreground: oklch(0.99 0 0);",
  "--bubble-agent: var(--bubble-in);",
  "--bubble-user: var(--bubble-out);",
  "--bubble-user-foreground: var(--bubble-out-foreground);",

  // session-state palette (theme-invariant — defined once, inherited into `.dark`)
  "--situation-needs: oklch(0.62 0.22 25);",
  "--situation-working: oklch(0.76 0.16 150);",
  // YOUR MOVE — the owner's queue, and the one situation that outlives a turn.
  //
  // It was grey-blue, a second shade of nothing next to `rest`, which is why no
  // app ever used it. But it is not nothing: it means "it asked you something
  // and handed the turn back" — the ball is in your court, and the whole point
  // is that you can see it without opening anything. Amber sits between
  // producing-green and needs-you-red because that is exactly where the claim
  // sits: something is owed, nothing is stuck.
  //
  // Shared deliberately rather than left to each app: "your move" must mean the
  // same colour in astrobot's rail and astrocalendar's, or the fleet teaches the
  // owner two vocabularies.
  "--situation-idle: oklch(0.80 0.15 78);",
  "--situation-rest: oklch(0.46 0.02 240);",
  "--situation-ultra-h: 300;",
  "--situation-ultra: oklch(0.62 0.24 var(--situation-ultra-h));",
  "--situation-ultra-text: oklch(0.70 0.22 var(--situation-ultra-h));",
  // the mascot override block — the ONLY names an app may set on `@astrobot/mascots` (see
  // console/lib/mascot-adapter.ts's doc-comment for the same discipline on the astrobot side).
  "--mascot-state-attention: var(--situation-needs);",
  "--mascot-state-active: var(--situation-working);",
  "--mascot-state-thinking: var(--situation-working);",
  "--mascot-state-idle: var(--situation-idle);",
  "--mascot-state-sleeping: var(--situation-rest);",
  "--mascot-ultra-h: var(--situation-ultra-h);",
  "--mascot-ultra: var(--situation-ultra);",
  "--mascot-beam: var(--primary);",
]

/** `.dark { … }` — identity overrides only (the CLOSED geometry is theme-invariant, declared once
 *  in `ROOT`). Copied value-for-value from astrobot's `.dark` block. */
export const DARK: readonly string[] = [
  "--background: oklch(0.155 0.005 var(--acc-h));",
  "--foreground: oklch(0.96 0.004 var(--acc-h));",
  "--card: oklch(0.19 0.006 var(--acc-h));",
  "--card-foreground: oklch(0.96 0.004 var(--acc-h));",
  "--popover: oklch(0.20 0.006 var(--acc-h));",
  "--popover-foreground: oklch(0.96 0.004 var(--acc-h));",
  "--primary: oklch(0.80 var(--acc-c) var(--acc-h));",
  "--primary-foreground: oklch(0.18 0.03 var(--acc-h));",
  "--secondary: oklch(0.235 0.007 var(--acc-h));",
  "--secondary-foreground: oklch(0.96 0.004 var(--acc-h));",
  "--muted: oklch(0.235 0.007 var(--acc-h));",
  "--muted-foreground: oklch(0.66 0.012 var(--acc-h));",
  "--accent: oklch(0.255 0.009 var(--acc-h));",
  "--accent-foreground: oklch(0.96 0.004 var(--acc-h));",
  "--destructive: oklch(0.62 0.2 25);",
  "--warn: oklch(0.80 0.13 85);",
  "--ok: oklch(0.72 0.15 155);",
  "--border: oklch(1 0 0 / 8%);",
  "--input: oklch(1 0 0 / 12%);",
  "--ring: oklch(0.80 var(--acc-c) var(--acc-h));",
  "--chart-1: oklch(0.80 var(--acc-c) var(--acc-h));",
  "--chart-2: oklch(0.70 0.10 200);",
  "--chart-3: oklch(0.65 0.12 160);",
  "--chart-4: oklch(0.72 0.13 85);",
  "--chart-5: oklch(0.68 0.15 25);",
  "--sidebar: oklch(0.205 0.007 var(--acc-h));",
  "--sidebar-foreground: oklch(0.96 0.004 var(--acc-h));",
  "--sidebar-primary: oklch(0.80 var(--acc-c) var(--acc-h));",
  "--sidebar-primary-foreground: oklch(0.18 0.03 var(--acc-h));",
  "--sidebar-accent: oklch(0.255 0.009 var(--acc-h));",
  "--sidebar-accent-foreground: oklch(0.96 0.004 var(--acc-h));",
  "--sidebar-border: oklch(1 0 0 / 8%);",
  "--sidebar-ring: oklch(0.80 var(--acc-c) var(--acc-h));",

  "--panel: oklch(0.19 0.006 var(--acc-h));",
  "--panel-2: oklch(0.225 0.007 var(--acc-h));",
  "--faint: oklch(0.60 0.012 var(--acc-h));",
  "--border-soft: oklch(1 0 0 / 5%);",
  "--border-strong: oklch(1 0 0 / 15%);",
  "--accent-solid: oklch(0.52 var(--acc-c) var(--acc-h));",
  "--accent-ink: oklch(0.84 var(--acc-c) var(--acc-h));",
  "--code-bg: oklch(0.30 calc(var(--acc-c) * 0.35) var(--acc-h));",
  "--channel-ink: oklch(0.16 0.02 240);",
  "--metal-ring: oklch(0.19 0.006 var(--acc-h));",
  "--wa: #48ca8c;",
  "--tg: #3aa6de;",
  "--slack: #b57bd8;",
  "--mail: #e0a33a;",
  "--teams: #7b83e8;",
  "--cu: #e06fa8;",
  "--green: #48ca8c;",
  "--amber: #e0a33a;",
  "--acc-dim: color-mix(in oklch, var(--primary) 15%, transparent);",
  "--acc-line: color-mix(in oklch, var(--primary) 34%, transparent);",

  "--bubble-in: oklch(0.225 0.006 var(--acc-h));",
  "--bubble-out: oklch(0.52 var(--acc-c) var(--acc-h));",
  "--bubble-out-foreground: oklch(0.99 0 0);",
  "--bubble-agent: var(--bubble-in);",
  "--bubble-user: var(--bubble-out);",
  "--bubble-user-foreground: var(--bubble-out-foreground);",
]
