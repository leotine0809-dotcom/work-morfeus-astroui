// @astro/ui/tokens — the PURE half (no React, safe to `import` from a Node check script): the
// geometry mirror, the closed-token name list, and the refusal API. See `source.ts` for the token
// architecture and `check.ts` for the refusal rules (PD-5/PD-6, phase 53).
export { GEOMETRY, CLOSED_TOKENS } from "./source"
export { assertNoGlobalOverride, GlobalTokenOverrideError } from "./check"
