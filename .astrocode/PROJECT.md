# astro-ui — PROJECT (restart from 0, 2026-09-03)

> The old 31-phase roadmap (astrochat at 8, [Playbook] 21-26 + [Ops] 27-30 = 10 non-code phases,
> most of it planned before touching the real product) is archived in `legacy/astrocode-v1/`.
> This is the clean anchor. **Detailed phases: to be written next — deliberately not here yet.**

## What astro-ui is (after the architecture review)
A **React component library** (build-time) + **reliability gates** + **design tokens** extracted from
the validated astrobot console. It is **not** a "the agent writes the whole app in JSON" architecture.

**The bivio, settled — React is the frame, JSON is a payload (two DIFFERENT consumers, separated):**
- **React = the primary road (build-time).** Tokens, primitives, astrochat — written in normal React.
  This is where the real UI is made. An agent that authors *new components* writes React, held by the gates.
- **JSON allow-list = a narrow run-time feature.** Only for one case: an agent emitting UI *inside a
  message* (a card, a form, a choice) — safe because allow-listed, no arbitrary React at runtime.
- **Do NOT route the whole app through the JSON renderer.** astrochat's UI is fixed (list, composer,
  panels); the agent generates *content*, not *layout*. The `spike/declarative-ui/` renderer stays the
  experiment for that one case, not the architecture.

## Packaged — `@astro/ui` is now an installable library (phase 32, 2026-09-03, verified)
The components + tokens moved OUT of the spike into **`packages/ui/` = `@astro/ui`**: an npm-workspace
package with a tsup build (ESM + `.d.ts` + `styles.css`), react as a peerDep, installable by
`npm i file:…/packages/ui` (no registry in v1). astrochat (`spike/declarative-ui`) now **consumes it
by name** (`import { MessageBubble } from "@astro/ui"`); all six gates stay green through the split.
This is the project's #1 objective delivered — a library Alex grows while building his apps. JSON
agent-runtime deferred to a later `@astro/ui/runtime` subpath.

## Carried over from the spike (do NOT rebuild — this is the value)
- **15 React components** + their Zod prop schemas — now in **`packages/ui/src/components/`** (`@astro/ui`), single-use, deduped.
- **The gates** (`spike/declarative-ui/gates/`): contrast · theme/no-hardcoded · responsive+axe A/AA · contract tests. **These are already "the CI that fails."**
- **`DESIGN-DNA.md`** (astrobot's validated tokens/treatments/mechanics, source-referenced) · **`COMPONENT-MAP.md`** (Hermes↔astrobot↔catalog unification + redundancy pass) · **`A2UI.md`** (adopt-the-standard trigger).

## The order (north star — the reviewer's, confirmed) — STATUS 2026-09-03
1. ✅ **Contract from TS types + CI** — DONE. `src/contracts.ts` generates the `$generated` half from
   each Zod schema; `--check` fails the build on drift; a11y/forbidden/examples/`stable` stay
   hand-written. Wired into `gate:static`.
2. 🟡 **primitives** — 15 comms-domain components re-anchored on astrobot SOURCE. NOTE (see
   `PRIMITIVES-AND-MECHANICS.md`): the full catalog is ~50 across 7 tiers, not 10 — the 15 are the top
   (domain) tier. The **overlay tier is now started**: `Overlay` (Radix Dialog, modal+drawer) +
   `Menu` (Radix DropdownMenu) + `Toaster` (sonner) built & verified live. Still to validate on the
   LIVE astrobot console.
3. ✅ **The 3 acute hard problems** — resizable panes ✅ · chat scroll ✅ (stick-to-bottom + jump FAB +
   unseen count) · z-index/overlay authority ✅ (`--z-*` ladder). Focus-trap came free with the Radix
   overlays. (`PRIMITIVES-AND-MECHANICS.md` tracks the fuller ~14-mechanic list — 6 done.)
4. ❌ **astrochat = React-primary** — the big architectural correction. astrochat still runs entirely
   through the JSON renderer (the phase-31 dogfood); reviewer says JSON is for agent-emitted in-message
   content only. Direction settled, refactor pending (large, no *visible* gain until an agent-content
   feature exists).
5. ✅ **Screenshot gate on `stable`** — DONE. `gates/screenshot.mjs` pixel-diffs every `stable:true`
   contract (7 promoted) in dark+light off the `lab.html?shot=` harness vs committed `gates/baselines/`;
   `UPDATE_SNAPSHOTS=1` to re-baseline. Proven: deterministic re-run, catches a real change precisely,
   green on revert. Wired into `verify`.

## Out of the code roadmap
**[Playbook] and [Ops]** (old phases 21-30) are **not code** — they live in a separate doc/tracker,
not this roadmap. Counting them as work is why it "looked stuck."

## Constraints (kept)
React 19 + TS + Tailwind v4 + shadcn primitives (pull the atoms, author the domain). Every colour a
token. Every component ships through the gates. Publishable package is a later step, not the shim.
