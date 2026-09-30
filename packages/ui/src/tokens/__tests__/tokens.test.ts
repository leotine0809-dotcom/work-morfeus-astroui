// tokens.test.ts — the ONE test that owns the agreement between `GEOMETRY` (the JS mirror) and the
// generated `src/tokens.css` (ADR-0047: a claim asserted twice is checked once), plus the refusal
// API's contract (PD-5, phase 53). Uses the dynamic-import pattern (ADR-018) so this file stays
// load-safe regardless of task/execution order — this IS the task that creates the exports, but
// the pattern is kept for consistency with every other astro-ui test this phase writes.
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TOKENS_CSS_PATH = path.join(HERE, "..", "..", "tokens.css")

describe("assertNoGlobalOverride — the refusal API (PD-5)", () => {
  it("throws, naming the token and the file, when a GLOBAL token is declared", async () => {
    const { assertNoGlobalOverride, GlobalTokenOverrideError } = await import("../check.ts")

    let caught: unknown
    try {
      assertNoGlobalOverride(":root{--app-header-h:72px}", "x.css")
    } catch (err) {
      caught = err
    }

    expect(caught).toBeInstanceOf(GlobalTokenOverrideError)
    const message = (caught as Error).message
    expect(message).toContain("--app-header-h")
    expect(message).toContain("x.css")
  })

  it("does NOT throw for an IDENTITY override (accent, radius, font)", async () => {
    const { assertNoGlobalOverride } = await import("../check.ts")

    expect(() =>
      assertNoGlobalOverride(":root{--acc-h:12;--radius:1rem;--font-family-sans:Inter}", "identity.css"),
    ).not.toThrow()
  })

  it("does NOT throw for a var(--closed-token) USAGE — only a declaration is refused", async () => {
    const { assertNoGlobalOverride } = await import("../check.ts")

    expect(() =>
      assertNoGlobalOverride(".band { height: var(--app-header-h); }", "usage.css"),
    ).not.toThrow()
  })
})

describe("GEOMETRY <-> src/tokens.css agreement (ADR-0047)", () => {
  it("declares every CLOSED_TOKENS name with the value derived from GEOMETRY", async () => {
    const { GEOMETRY, CLOSED_TOKENS } = await import("../source.ts")
    const css = readFileSync(TOKENS_CSS_PATH, "utf8")

    const radius = (scale: number) => `calc(var(--radius) * ${scale})`
    const expected: Record<string, string> = {
      "--app-header-h": `${GEOMETRY.appHeaderPx}px`,
      "--rail-icon-w": `${GEOMETRY.iconRailPx}px`,
      "--rail-left-min": `${GEOMETRY.leftRail.minPx}px`,
      "--rail-left-max": `${GEOMETRY.leftRail.maxPx}px`,
      "--rail-left-snap": `${GEOMETRY.leftRail.snapPx}px`,
      "--rail-left-default": `${GEOMETRY.leftRail.defaultPx}px`,
      "--rail-right-min": `${GEOMETRY.rightRail.minPx}px`,
      "--rail-right-max": `${GEOMETRY.rightRail.maxPx}px`,
      "--rail-right-snap": `${GEOMETRY.rightRail.snapPx}px`,
      "--rail-right-default": `${GEOMETRY.rightRail.defaultPx}px`,
      "--breakpoint-narrow": `${GEOMETRY.narrowMaxPx}px`,
      "--z-base": `${GEOMETRY.z.base}`,
      "--z-raised": `${GEOMETRY.z.raised}`,
      "--z-sticky": `${GEOMETRY.z.sticky}`,
      "--z-scrim": `${GEOMETRY.z.scrim}`,
      "--z-modal": `${GEOMETRY.z.modal}`,
      "--z-dropdown": `${GEOMETRY.z.dropdown}`,
      "--z-toast": `${GEOMETRY.z.toast}`,
      "--spacing": `${GEOMETRY.spacingRem}rem`,
      "--radius-sm": radius(GEOMETRY.radiusScale.sm),
      "--radius-md": radius(GEOMETRY.radiusScale.md),
      "--radius-lg": radius(GEOMETRY.radiusScale.lg),
      "--radius-xl": radius(GEOMETRY.radiusScale.xl),
      "--radius-2xl": radius(GEOMETRY.radiusScale["2xl"]),
      "--radius-3xl": radius(GEOMETRY.radiusScale["3xl"]),
      "--radius-4xl": radius(GEOMETRY.radiusScale["4xl"]),
    }

    expect(CLOSED_TOKENS.length).toBe(Object.keys(expected).length)
    for (const name of CLOSED_TOKENS) {
      const value = expected[name]
      expect(value, `GEOMETRY has no expected value wired up for ${name}`).toBeDefined()
      const re = new RegExp(`${name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*:\\s*${value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*;`)
      expect(css, `${name} not declared as \`${value}\` in tokens.css`).toMatch(re)
    }
  })

  it("the generator's output equals the committed tokens.css byte-for-byte (EOL-normalized)", async () => {
    const generator = await import("../../../scripts/generate-tokens.ts")
    const generated = (generator as { render: () => string }).render()
    const committed = readFileSync(TOKENS_CSS_PATH, "utf8").replace(/\r\n/g, "\n")
    expect(generated).toBe(committed)
  })
})
