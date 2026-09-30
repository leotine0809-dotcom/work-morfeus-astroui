# Phase 32 — CRITERIA (plan-blind, goal-derived)

The phase succeeds iff astro-ui is a **real, installable library** a separate app can consume by
name. Each criterion is falsifiable by a command or a file check.

- **C1 — the package exists.** `packages/ui/package.json` declares `"name": "@astro/ui"`, `react`
  + `react-dom` as **peerDependencies** (not deps), a `build` script, and `exports` for `.`
  (import → JS, types → `.d.ts`) and `./styles.css`.
- **C2 — it builds to a real dist.** Running the package build produces `packages/ui/dist/` with an
  **ESM** entry, **`.d.ts`** type declarations, and a **`styles.css`** (the token layer). No build error.
- **C3 — the public API is complete.** The built entry exports, importable **by name**: the 15
  catalog components (Stack, Avatar, MessageBubble, RichText, ListSection, Chip, Attachment,
  AlertBanner, SearchField, ChipInput, ConversationItem, Composer, ThreadMarker, ChannelButton,
  Dossier) **plus** `Overlay`, `Menu`/`MenuItem`, `Toaster`, and `cn`. Types resolve for each.
- **C4 — a consumer installs + imports it by name.** The astrochat app (`spike/declarative-ui`)
  imports from `@astro/ui` (NOT relative `@/components/*`) via a workspace/`file:` link, imports
  `@astro/ui/styles.css`, and **still builds** (`npm run build` exit 0).
- **C5 — installability is proven against the BUILT package**, not just source: a smoke check
  resolves `@astro/ui` from `dist/` and type-checks `import { MessageBubble } from "@astro/ui"`.
- **C6 — the library keeps its guarantees.** The design-system gates that belong to the library
  (contrast, theme, contract, screenshot) still pass against the library's source in its new home.
- **C7 — the consumer keeps its guarantees.** astrochat's app-level gates (responsive, axe a11y)
  still pass with it consuming `@astro/ui`.
- **C8 — tokens travel with the package.** `import "@astro/ui/styles.css"` supplies the `:root` +
  `.dark` token layer so imported components render themed (verified: a consumer renders a component
  with correct token colors, not unstyled).
- **C9 — one source of truth.** The library source is NOT duplicated between `packages/ui` and
  `spike/` — the app consumes the package; no stale second copy of a component remains in the spike.

**Out of bar (must NOT be required to pass):** npm publish/versioning; the `@astro/ui/runtime` JSON
subpath; astrochat converted to React-primary; a docs/Storybook site.
