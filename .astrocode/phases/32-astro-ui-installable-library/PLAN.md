# Phase 32 — PLAN (astro-ui installable library)

Sequential on-branch (one dependency chain; not parallelizable — moving source + rewiring imports).
Executed inline with verification after each stage. **No git commits** (Alex's rule); lands in the
working tree ready to commit.

## Tasks
- **t1 — workspace root.** Add repo-root `package.json` (private, npm workspaces: `packages/*`,
  `spike/declarative-ui`) + a root README note. Establishes the monorepo so `@astro/ui` resolves by
  name. *(→ C4)*
- **t2 — scaffold `packages/ui/`.** `package.json` (`@astro/ui`, peerDeps react/react-dom, deps:
  @radix-ui/react-dialog, radix-ui, sonner, lucide-react, clsx, tailwind-merge, zod; `exports` for `.`
  + `./styles.css`; `build` = tsup), `tsconfig.json`, `tsup.config.ts` (entry `src/index.ts`, format
  esm, dts, copy `styles.css`), `README.md`. *(→ C1)*
- **t3 — move library source.** Move `spike/src/components/` (the 15 + `ui/` + `channels.ts`) and
  `spike/src/lib/utils.ts` into `packages/ui/src/`. Convert internal `@/` imports to **relative**
  (a library must not depend on a consumer's path alias). *(→ C3, C9)*
- **t4 — extract tokens → `packages/ui/src/styles.css`.** The token layer of `globals.css`: `@theme
  inline` map, `:root` + `.dark` tokens, font imports, base resets, reduced-motion guard, the `--z-*`
  ladder. **NOT** app chrome (`.app`/`.sidebar`/`.thread`/`.resizer`/`.jump-fab`/Settings/menu/foot) —
  that stays with the app. *(→ C2, C8)*
- **t5 — public barrel `src/index.ts`.** Re-export every component + its props type, `Overlay`/
  `OverlayClose`, `Menu`/`MenuItem`/`MenuSeparator`, `Toaster` (from sonner), `cn`, and the channel
  meta. *(→ C3)*
- **t6 — build the package.** `npm i` at root (links the workspace), run the `@astro/ui` build →
  assert `dist/index.mjs` + `dist/index.d.ts` + `dist/styles.css` exist. *(→ C2)*
- **t7 — rewire astrochat to consume `@astro/ui`.** In `spike/`: add `@astro/ui` dependency; replace
  `@/components/*` + `@/lib/utils` imports with `@astro/ui`; make `app`/`lab`/`settings` import
  `@astro/ui/styles.css`; trim the app's `globals.css` to app chrome only (tokens now come from the
  package). Delete the moved source from `spike/src`. *(→ C4, C9)*
- **t8 — repoint the gates.** Library gates (contrast/theme read the token CSS; contract reads the
  catalog; screenshot uses the lab) point at the library's `styles.css` / the app that renders it, so
  they stay green; app gates (responsive/a11y) unchanged. *(→ C6, C7)*
- **t9 — prove installability (built package).** A scratch smoke: resolve `@astro/ui` from `dist/`
  and type-check `import { MessageBubble } from "@astro/ui"`. *(→ C5)*
- **t10 — verify the phase.** App `npm run build` exit 0; all six gates green; dist importable;
  no duplicated source. Check every criterion C1–C9. *(→ all)*

## Risks / mitigations
- **Import-alias churn (t3):** convert `@/` → relative inside the library so it's portable; the app
  keeps its own `@/` for app-only files. Verify with `tsc` after the move.
- **Gate coupling (t8):** the gates were written against the spike layout; repoint paths rather than
  rewrite logic. If a gate can only run inside the app (screenshot/a11y need the rendered app), it
  stays an *app* gate that exercises the library through the app — still valid coverage.
- **Tailwind utilities:** v1 relies on the consumer's Tailwind to compile the components' utility
  classes; documented in the package README. Pre-compiled CSS is a later hardening step.
