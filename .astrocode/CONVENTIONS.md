# Conventions — astro-ui

> The rules new code MUST follow. Read before touching code. Backing detail:
> [`docs/ASTRO-UI-MASTER-CHECKLIST.md`](../docs/ASTRO-UI-MASTER-CHECKLIST.md). astro-ui is a **published
> API and an internal product**, not a component dump.

## Stack

- **React 19 + Tailwind v4 + shadcn/ui + TypeScript.** React/React-DOM/Tailwind are **peerDependencies**
  (never bundled). Radix via the unified **`radix-ui`** meta-package; `class-variance-authority`, `clsx`,
  `tailwind-merge`, `tw-animate-css`, `cmdk`.
- Build: **tsup** (or Vite lib mode) → ESM + `.d.ts` + source maps, `sideEffects` declared, per-component
  exports. Workshop: **Storybook**. Release: **changesets**.
- **Zero domain, zero SOMA.** Never import app state/network/host/`@soma/*` (see the boundary in PROJECT.md).

## Token architecture (load-bearing)

- **Three tiers, always:** `primitive → semantic → component`
  (`blue.500` → `color.action.primary` → `button.primary.bg`). **Components consume semantic/component
  tokens only — never raw palette.**
- **Canonical format is DTCG-compatible** (typed values, groups, aliases, metadata, deprecation) — the
  one source for code and Figma; do not invent an astro-ui-only schema.
- **CI validates tokens** (missing/circular/broken aliases, invalid colour/unit, duplicate semantics,
  deprecated usage) and **theme contracts** (a theme fails to ship if a required semantic token is absent).

## Naming — STANDARD only, no codenames

shadcn/industry + DTCG vocabulary. Never carry astrobot/SOMA lore. Translation as things are lifted:

> **Superseded for the token layer by ADR-039 + astrobot PLAN.md PD-1 (phase 53, 2026-09-11).**
> The table below was the aspiration before phase 53 shipped a real neutral token source
> (`packages/ui/src/tokens/source.ts`) that astrobot's own console reads directly. PD-1 kept
> astrobot's ACTUAL names (`--acc-h`, `--acc-c`, `--bubble-user`, `--situation-*`, …) instead of
> renaming to this table, because the design authority is the software in daily use
> (CALL-2026-09-11.md) and a rename would touch every astrobot file that reads a var for zero user
> value. `--bubble-agent`/`--bubble-user` DO exist, kept as aliases of the newer
> `--bubble-in`/`--bubble-out`. This table still states this file's ORIGINAL intent for a from-scratch
> consumer (e.g. a marketing Hero with no astrobot lineage); it is not the contract phase-53's
> token generator honours.

| Codename (astrobot/SOMA) | astro-ui name |
|---|---|
| `--acc-h` / `--acc-c` | `--primary-hue` / `--primary-chroma` (primitive tier) |
| `--primary` | `--primary` (semantic — unchanged) |
| `--bg-wash` / "gunmetal" | `--background` |
| `.soma-metal` / "brushed-metal" | `--surface` + `.panel` (raised variant) |
| `--bubble-agent` / `--bubble-user` | `--bubble-in` / `--bubble-out` |
| `--situation-*` | `--status-danger/success/muted` |
| accent codenames (ice/phosphor) | plain hue names (blue/green/rose…) |

Component files lowercase (`button.tsx`, `scroll-area.tsx`, `resize-handle.tsx`).

## Layering (where code goes)

`Foundations → Primitives → Components → Patterns → Domain → Themes → Tooling` (PROJECT.md §Architecture).
- **Domain (Message/AgentStatus/ConversationItem) is above core, never in it.** Comms patterns ship with
  astrochat; agent patterns later. Mascots live in `@astrobot/mascots`; core only defines the slot.
- **Promotion, not accumulation:** `local → pattern → candidate → core`. Most reusable components stay in
  the app; only cross-domain, proven ones enter astro-ui.

## CSS architecture (must be predictable)

- **Installing astro-ui must NOT restyle a consumer app globally.** No leaking global selectors/resets;
  tokens as scoped CSS vars; explicit Tailwind ownership + cascade layers; class-merge via `cn`
  (clsx + tailwind-merge). Ship a **tokens CSS + a Tailwind preset**, not a global stylesheet that bleeds.

## Component API discipline

- Controlled **and** uncontrolled where it makes sense; ref-forwarding; DOM/`aria-*` passthrough; typed
  props + generics; sensible defaults; **a11y baked into defaults**. Deliberate **escape hatches** (slots,
  `className`, `asChild`) — never require forking/`!important`/monkey-patch.
- **Systematic variants only** (`variant/size/intent/tone/density`), rules against variant explosion — no
  `purple`, `slightlySmaller`, `specialAstrobotButton`.
- Every interactive component ships the full **state set** (default/hover/focus-visible/active/selected/
  disabled/read-only/loading/error/dragging/…), not just the happy path.

## Accessibility — a package invariant

WCAG 2.2 is the baseline for every component: keyboard operable, visible+unobscured focus, focus
management/trap/restore, semantic HTML/ARIA, live-region announcements, contrast + non-text contrast,
**never colour alone**, min target size, **keyboard alternative to any drag**, reduced-motion, 200% zoom.
A component isn't done if it fails these.

## Testing / verification

- **Storybook is the living contract + test surface.** Every component gets stories for states/sizes/
  variants/dark/themes/responsive, with a11y notes and do/don't.
- Layers: unit · render · interaction · **accessibility** · **visual-regression** (a token change that
  alters N components must fail CI) · theme · responsive · keyboard · type tests.
- Verify visually in **both themes**; run the Storybook + screenshot. "Renders in the file" is not "works".
- Gates: clean `tsc`, a build that emits ESM+types, token+theme-contract validation green.

## Versioning & evolution

- **Semver**, plus an explicit **visual-breaking-change** definition (changing `spacing.4` may keep the API
  but break every product → treat as breaking). Automated changelog via changesets (Added/Changed/Fixed/
  Deprecated/Removed/Accessibility/Breaking/Migration).
- **Deprecation lifecycle** `introduced → stable → deprecated → removed` with runtime warnings; migrations
  ship codemods + old/new coexistence, **never a forced rewrite**. Release channels `latest/next/canary`.
- **Governance:** named owner + publish rights + breaking-change authority; an `@astro/ui/experimental`
  entry for unstable primitives; lint rules (no raw hex/spacing/z-index, no raw `<button>` where the
  system Button is required) added incrementally.
