<!-- astro-discuss: captured -->
# Phase 32 — astro-ui installable library · CONTEXT

**Goal:** take the validated component work out of `spike/declarative-ui/` and make it a **real,
installable library** Alex can `npm install` into any of his apps and grow while he works — the
project's #1 objective ("una libreria che crea app in stile astro… senza repo condivise"). astrochat
(= Hermes's UI in astro-style) stays as the first *consumer* that proves the library works.

## Decisions (discussed 2026-09-03)
- **Package name:** `@astro/ui`. → `import { MessageBubble } from "@astro/ui"` + `import "@astro/ui/styles.css"`.
- **Distribution:** **local path / tarball**, no registry in v1. Apps install via `npm i file:…/packages/ui`
  (or a `npm pack` tarball). Publishing to npm is a *later* step, deliberately out of scope now.
- **v1 scope = components + tokens ONLY.** The UI kit: the 15 catalog components + the overlay-tier
  primitives (`Overlay`, `Menu`) + a `Toaster` re-export + the design **tokens** (the `:root`/`.dark`
  token layer of `globals.css`, as `styles.css`) + `cn`. **OUT of v1:** the JSON runtime
  (`catalog`/`adapter`/`pipeline`/`registry`) — it ships later as a separate subpath `@astro/ui/runtime`
  for the agent-emitted-in-message case. Also OUT: app chrome (`app.tsx`, `settings.tsx`, `lab.tsx`)
  and app-only CSS (`.app`, `.sidebar`, `.thread`, `.resizer`, `.jump-fab`, Settings modal) — those
  belong to the astrochat *consumer*, not the library.
- **Build:** **tsup** → ESM + `.d.ts`. Tokens shipped as a real `styles.css` side-effect import.
  React/react-dom are **peerDependencies** (the app provides them). Radix/sonner/lucide/clsx/twMerge
  are runtime deps of the library.
- **Location + wiring:** `packages/ui/` at the repo root (out of `spike/`). Introduce a package
  **workspace** so `spike/declarative-ui` (astrochat) consumes `@astro/ui` by name — the proof the
  library works as a dependency, not via relative paths.

## Scope boundaries
- **In:** create `packages/ui/` package; move the reusable source into it; public `index.ts` barrel +
  `styles.css`; tsup build → `dist/`; wire the astrochat app to import from `@astro/ui`; keep the
  library-level gates (contrast · theme · contract · screenshot) green against the moved source (they
  move/repoint with the library); keep the app building + its app-level gates (responsive · a11y) green.
- **Out (deferred, note them, don't build):** publishing to npm / versioning flow; the `@astro/ui/runtime`
  JSON subpath; a Storybook/docs site; converting astrochat to React-primary (that's the separate Step 4);
  Tailwind-preset extraction (v1 ships plain token CSS + whatever utility classes the components already use).

## Assumptions / open
- Tailwind v4: the components use utility classes compiled by the *consumer's* Tailwind. v1 ships the
  token CSS + relies on the consuming app's Tailwind to compile the utilities (documented in the README).
  A self-contained pre-compiled CSS is a later hardening step if a non-Tailwind app needs it.
- **No git commits** unless Alex asks (his standing rule overrides astro-execute's per-task commit
  convention) — the phase lands in the working tree, ready to commit on his word.
