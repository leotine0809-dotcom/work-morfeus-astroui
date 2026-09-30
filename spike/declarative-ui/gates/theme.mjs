// astro-ui reliability gate — THEME COMPLETENESS.
// The black-on-black bug's ROOT class: a token defined in only one theme (or referenced but never
// defined) resolves to nothing in the other theme. This gate reads globals.css + every component,
// and fails the build if: (1) any token defined in `.dark` is missing from `:root` (→ undefined in
// light), or vice-versa; (2) any `var(--x)` referenced anywhere isn't defined in `:root`. Pure
// text analysis, no browser — fast and deterministic.
import { readFileSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = join(HERE, "..", "src")                                   // the astrochat app (consumer)
const LIB = join(HERE, "..", "..", "..", "packages", "ui", "src")     // @astro/ui (the library)
// Token DEFINITIONS now live in the library's styles.css; var() REFS live in BOTH the library
// components and the app chrome (globals.css + app .tsx). The gate reads defs from the library and
// scans refs across both trees.
// Token DEFINITIONS moved to the GENERATED tokens.css (styles.css is base-layer only now, phase 53);
// read defs from tokens.css so :root/.dark are actually seen. styles.css appended for any stragglers.
const css = readFileSync(join(LIB, "tokens.css"), "utf8") + "\n" + readFileSync(join(LIB, "styles.css"), "utf8")
const label = (f) => (f.startsWith(LIB) ? f.replace(LIB, "@astro/ui") : f.replace(SRC, "src"))

// Runtime-set vars that are intentionally NOT in :root: the accent knob (set on <html>) and the
// rail widths (set inline by the app; the CSS carries a fallback). Not themeable colours.
const ALLOW_SINGLE = new Set(["acc-h", "acc-c", "left-w", "right-w", "ev-h"])
// Layout constants that are the SAME in both themes by design (a z-ladder rung, a width) — a dark
// variant would be meaningless. The z-index authority (--z-base..--z-toast) lives only in :root.
const isThemeless = (t) => ALLOW_SINGLE.has(t) || t.startsWith("z-")
// Colours that are the SAME in both themes BY DESIGN: the situation palette (a state reads as the
// same colour in light and dark) and the mascot override block that aliases it. Named here so a
// NEW :root-only colour still fails — adding one to this list is a deliberate, reviewable act.
const THEME_CONSTANT_COLOUR = (t) => t.startsWith("situation-") || t.startsWith("mascot-")
// A value is a colour if it is a colour function/hex, or aliases another token (which may be one).
// Geometry (px/rem), unitless numbers (z, hue) and font stacks are not.
const isColourValue = (v) => /\b(?:oklch|oklab|lch|lab|hsla?|rgba?|color-mix)\(|#[0-9a-f]{3,8}\b|^var\(--/i.test(v)

// Grab the token block that a selector opens (first `{ ... }` after it). No nested braces inside.
function blockAfter(selector) {
  const i = css.indexOf(selector)
  if (i < 0) return ""
  const open = css.indexOf("{", i)
  const close = css.indexOf("}", open)
  return css.slice(open + 1, close)
}
const defsIn = (block) => new Set([...block.matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]))
const valuesIn = (block) => new Map([...block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))

const rootDefs = defsIn(blockAfter(":root {"))
const rootValues = valuesIn(blockAfter(":root {"))
const darkDefs = defsIn(blockAfter(".dark {"))

// every var(--x) reference across globals.css + all component/app source (.tsx/.ts)
function walk(dir) {
  let out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    // The token LAYER (tokens.css + the tokens/ source dir) DEFINES and @theme-maps tokens; it is
    // not a UI consumer, so its var() refs (e.g. @theme-inline maps to optional shadcn tokens like
    // --sidebar/--chart-*) are not black-on-black risks. __tests__ are fixtures. Scan only real
    // component/app render paths so a genuine undefined-token usage is still caught.
    if (e.isDirectory() && (e.name === "__tests__" || e.name === "tokens")) continue
    if (!e.isDirectory() && e.name === "tokens.css") continue
    if (e.isDirectory()) out = out.concat(walk(p))
    else if (/\.(tsx?|css)$/.test(e.name)) out.push(p)
  }
  return out
}
const refs = new Map() // token -> a file that references it
for (const f of [...walk(LIB), ...walk(SRC)]) {
  const txt = readFileSync(f, "utf8")
  for (const m of txt.matchAll(/var\(\s*--([\w-]+)/g)) {
    if (!refs.has(m[1])) refs.set(m[1], label(f))
  }
}

const fail = []

// (1) themeable tokens must exist in BOTH themes
for (const t of new Set([...rootDefs, ...darkDefs])) {
  if (isThemeless(t)) continue
  // A token in .dark but absent from :root is UNDEFINED in light.
  if (!rootDefs.has(t)) fail.push(`token --${t} is defined in .dark but MISSING from :root (undefined in light mode)`)
  // The reverse is never undefined (dark inherits the :root value) — but for a COLOUR that silent
  // inheritance IS the bug: a light-tuned colour shown on a dark surface. Geometry, numbers and font
  // stacks are theme-constant by nature, so only colours are held to it.
  else if (!darkDefs.has(t) && isColourValue(rootValues.get(t) ?? "") && !THEME_CONSTANT_COLOUR(t))
    fail.push(`colour token --${t} is defined in :root but MISSING from .dark (no dark variant — dark inherits the light value)`)
}

// (2) every referenced var(--x) must resolve at :root. `--color-*` come from @theme inline (which
// itself maps to a base token we already check), so they're exempt from the direct-definition rule.
for (const [t, where] of refs) {
  if (isThemeless(t) || t.startsWith("color-") || t.startsWith("font-") || t === "radius") continue
  if (!rootDefs.has(t)) fail.push(`var(--${t}) referenced in ${where} but NOT defined in :root (will resolve to nothing)`)
}

// (3) NO hardcoded colour literals in components — every colour must be a token (`var(--…)`), so a
// gate can reason about it and it themes/accents correctly. (A literal like text-[oklch(0.82…)] is
// exactly the brain-card bug: invisible in the other theme, and invisible to the contrast gate.)
const LITERAL = /\b(?:text|bg|border|from|to|via|fill|stroke|ring|shadow|decoration|outline)-\[(?:oklch|hsl|rgb|#)[^\]]*\]/g
for (const f of [...walk(LIB), ...walk(SRC)]) {
  if (!/\.tsx?$/.test(f)) continue
  for (const m of readFileSync(f, "utf8").matchAll(LITERAL)) {
    fail.push(`hardcoded colour \`${m[0]}\` in ${label(f)} — use a token (var(--…))`)
  }
}

console.log("\n  astro-ui · THEME-COMPLETENESS GATE\n")
console.log(`    :root tokens: ${rootDefs.size} · .dark tokens: ${darkDefs.size} · var() refs: ${refs.size}`)
if (fail.length) {
  console.log("\n  ✗ FAILURES:\n")
  for (const f of fail) console.log(`    • ${f}`)
  console.log("")
} else {
  console.log("    ✓ every themeable token exists in both themes; every var() ref resolves at :root\n")
}
process.exit(fail.length ? 1 : 0)
