# declarative-ui — the LLM-declares-a-UI spike

Phase 31's de-risking spike, proving one loop before the full astro-ui build:

```
LLM (claude -p) --emits--> A2UI-shaped declarative tree
   --> [A2UI -> json-render adapter]
   --> json-render renders --> shadcn catalog components (Zod-validated, allow-listed)
   --> a real astrochat conversation on screen
```

Standalone Vite + React 19 + Tailwind v4 + shadcn app. **Zero SOMA / zero `@soma/*` deps** — it
builds and runs from this directory alone. Components are ported *presentationally* from
`C:/AI ARMY/astrobot/console` (never imported from it) and renamed to standard vocabulary per the
repo's `CONVENTIONS.md` (`--bubble-agent`/`--bubble-user` -> `--bubble-in`/`--bubble-out`, etc.).

This is throwaway-grade — see `.astrocode/phases/31-.../CONTEXT.md` for what's explicitly out of
scope (the full contract/registry system, Storybook, DTCG tokens, versioning).

## Stack

React 19, Tailwind v4, shadcn/ui (radix base), Zod v4, Vercel `json-render`
(`@json-render/core` + `@json-render/react`). LLM transport is the **Claude Code CLI** (`claude -p`,
reusing the machine's Claude auth) — no `ANTHROPIC_API_KEY`, no `@anthropic-ai/sdk` (ADR-002).

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Runs `tsc -b && vite build`.
