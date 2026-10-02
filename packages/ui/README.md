# @astro/ui

The **astro-style component kit** — the validated astrobot-console design as an installable React/TS
library. Comms-domain components (chat bubble, conversation row, composer, dossier, …) + overlay
primitives (Overlay, Menu, Toaster on Radix) + the design **tokens**. Backend-agnostic: it's the UI
layer, it doesn't care whether the app behind it is Go or Python.

## Install (v1: local, no registry)

From another app in this workspace, or by path/tarball:

```bash
npm i file:../astro-ui/packages/ui          # local path
# or: cd packages/ui && npm pack  → npm i ../astro-ui/packages/ui/astro-ui-0.1.0.tgz
```

## Use

```tsx
import "@astro/ui/styles.css"                // the design tokens + base (do this once, at the app root)
import { MessageBubble, Composer, Overlay } from "@astro/ui"

<MessageBubble text="Slide 4 is 🔥" direction="out" />
```

## Requirements (v1)

The components use **Tailwind v4** utility classes, so the consuming app must:

1. Use Tailwind v4 (`@import "tailwindcss"` in your CSS) + `tw-animate-css` (for the overlay animations).
2. Import the tokens: `@import "@astro/ui/styles.css";` in your Tailwind-processed CSS.
3. Let Tailwind **scan the library** so its utilities are generated:
   `@source "../node_modules/@astro/ui/dist";` (or the package `src` in a workspace).
4. **Dedupe React** if you installed via `file:`/link (a symlinked package resolves its own React →
   `Cannot read properties of null (reading 'useState')`). In Vite: `resolve: { dedupe: ["react", "react-dom"] }`.

A full worked example (Go backend + this library) lives in `../../astrochat-go`.

A pre-compiled, Tailwind-free stylesheet is a later hardening step. Publishing to npm is deliberately
out of v1 — this ships as a local package you grow while building your apps.

## What's inside

15 comms components + `Overlay`/`Menu`/`Toaster` + `cn`, each with its Zod prop schema exported.
The JSON agent-runtime (`catalog`/`adapter`/`pipeline`) is **not** in v1 — it will ship as a separate
`@astro/ui/runtime` subpath for the "agent emits UI inside a message" case.

## Tokens (phase 53 — ADR-039: "Globale = geometria e ritmo. Identità = tutto ciò che si vede.")

`@astro/ui` is the ONE token source; the CSS every app imports is GENERATED from it
(`src/tokens/source.ts` → `npm run generate` → `src/tokens.css`, committed). Two halves:

- **CLOSED (GLOBAL, owned by the library)** — the 60px header band, rail widths, the z-index
  ladder, the breakpoint, the spacing base, the radius SCALE. An app may not redeclare one of
  these; `assertNoGlobalOverride` throws `GlobalTokenOverrideError` (naming the token, the file,
  the line) the moment it tries. The name list is `CLOSED_TOKENS`; the number mirror an app reads
  instead of a magic literal is `GEOMETRY` — both from `@astro/ui/tokens`.
- **OPEN (IDENTITY, owned per app)** — the accent hue/chroma, `--radius` itself, the font family
  vars, every colour (`background` … `bubble-*`, `situation-*`, the `--mascot-*` override block).
  Defaults are astrobot's own values (the design authority); any app may re-declare any of these
  in its own stylesheet, freely — no test refuses it.

An app declares its identity by setting these vars on `:root`/`.dark` in its OWN stylesheet, after
importing `@astro/ui`'s tokens (later declarations win the CSS cascade):

```css
@import "@astro/ui/styles.css"; /* or ./tokens.css if the app supplies its own base layer */
:root { --acc-h: 292; --acc-c: 0.13; --radius: 0.75rem; }
```

Three entries: `@astro/ui` (components), **`@astro/ui/tokens`** (pure — `GEOMETRY`,
`CLOSED_TOKENS`, `assertNoGlobalOverride`, `GlobalTokenOverrideError`; no React, safe to `import`
from a Node check script), `@astro/ui/primitives` (the shadcn floor, phase 53 t15). CSS subpaths:
`./tokens.css` (generated, tokens only) and `./styles.css` (`@import "./tokens.css"` + the base
layer).

The names gate (no banned lore in a shipped surface) runs against this package too:
`bash <astrobot>/scripts/check-names.sh <this-repo>/packages/ui/src`.
