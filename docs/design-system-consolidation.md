# ADR: Design-system consolidation — one `@astro/ui`, three products

**Status:** accepted, in progress (slice 1 landed).
**Context products:** `astrobot` (Next 15 console, the ORIGIN), `astrocalendar` (Vite web), `astrochat` (Vite web).

## Problem

`@astro/ui` is a **hand-ported copy of astrobot**, and astrobot imports nothing from it.
So today the fleet has astrobot's original *plus* the kit's copy — redundant by
construction — and the three products render the same design three different ways:

- **astrocalendar** — consumes the kit fully (shell, settings, overlays, grids).
- **astrochat** — consumes kit *components* + tokens, but hand-builds its own shell + settings, with local `Logo` / `ConversationItem` / `ResizeHandle` forks.
- **astrobot** — 0 kit imports; bespoke shadcn/Radix shell (`fleet.tsx`), own tokens (`globals.css`).

## Decision

**One implementation of each shared component lives in `@astro/ui`, canonically
named, and all three products import it — astrobot included.** A component used by
only one product stays local (that is *correct*, not redundant). Product-specific
domain pieces (`WeekGrid`, `ChannelStrip`, chat cards) live in the kit only if a
second product will need them.

## The anti-redundancy rule

> **Shared by ≥2 products → the kit (canonical name; props absorb per-product variance).
> Used by 1 → stays local.**

Two products differing visually is **a prop/variant**, never a fork.

## Canonical naming map

| concept | canonical (`@astro/ui`) | astrobot | astrochat | astrocalendar |
|---|---|---|---|---|
| list-pane shell | `AppShell` | `FleetList` + `CollapsedSidebar` | inline shell (App.tsx) | ✅ uses it |
| brand mark | `Logo` | `logo.tsx` (2-asset) | local `logo.tsx` fork | ✅ (via AppShell) |
| identity chip | `Avatar` | `agent-avatar` (Mascot) | ✅ | ✅ (via AppShell) |
| settings frame | `SettingsDialog` / `SettingsGroup` / `SettingRow` | `settings.tsx` `Row`/`GroupLabel` | own `Overlay` copy | ✅ |
| modal / drawer | `Overlay` | shadcn `ui/dialog` | ✅ | ✅ (+ 2 local overlays to fold in) |
| dropdown / menu | `Menu` / `MenuItem` | shadcn `ui/dropdown-menu` | ✅ | ✅ |
| toggle | `Switch` / `SwitchVisual` | shadcn `ui/switch` | — | local (folded → kit, slice 1) |
| segmented control | `Segmented` | shadcn tabs | `ui/tabs` | local |
| token select | `Select` / `SettingSelect` | shadcn `ui/select` | — | local |
| chip / token field | `ChipInput` | shadcn | — | local `GuestInput` (richer; keep as variant) |
| list row | `ConversationItem` | — | local row | — |
| resizer | owned by `AppShell` | `resizer.tsx` | `resize-handle.tsx` | (AppShell) |
| banner | `AlertBanner` | `secrets-warning` | local `EmptyState` idiom | ✅ |

## The port recipe (behaviour-preserving — no pixel changes)

For each component, leaf → shell:

1. **Pick the best existing implementation** as canonical (usually astrobot's — the kit is already a copy of it).
2. **Parameterize differences as props/slots**, not forks — where two products differ visually, that difference is a prop so the one kit component renders both current looks.
3. Each product **imports the kit version and DELETES its local copy**.
4. **Visual-diff against the baseline.** Identical → keep. Different → the prop in (2) was wrong; fix it, don't fork.

Tokens come first: the kit's `styles.css` is the **union superset** so any component ports cleanly and astrobot can eventually adopt the one token file.

## astrobot is the decisive step

Next 15 consumes a React lib fine (React 19 peer matches; Tailwind v4 in both).
astrobot keeps its shadcn primitives for its own chat surfaces but **imports the kit
for the shared shell/settings/logo/avatar** and deletes those originals. Until
astrobot is a consumer, the fork is never gone.

## Progress

- **Slice 1 (landed):** committed the kit source (was untracked); merged astrobot's
  origin tokens into `styles.css` as a superset (situation/sidebar/bubble aliases/
  chart/mascot + semantic `--destructive`/`--warn`/`--ok`); added canonical `Switch`
  to the kit; `Logo` gained a `viewBox` prop so astrochat can adopt it un-cropped;
  de-forked `Switch` (astrocalendar) and `Logo` (astrochat).
- **Slice 2 (landed):** canonical `Segmented` + `Select` (`SettingSelect` alias) →
  kit; astrocalendar de-forked both (local copies deleted, builds clean). The kit
  now owns every token-based leaf widget the web siblings share.
- **Next — the careful phase (needs visual before/after, not a blind swap):**
  astrochat `ConversationItem` de-fork (parameterize to match its richer row);
  fold astrocalendar's `TranscriptReader` drawer onto `Overlay` (the `EventPeek`
  anchored popover has no `Overlay` equivalent — leave or add an anchored variant);
  then the shell tier (astrochat → `AppShell`), then **astrobot adoption** (import
  the kit for shell/settings/logo/avatar) — the step that finally removes the fork.
