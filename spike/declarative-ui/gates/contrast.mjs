// astro-ui reliability gate — CONTRAST.
// A design system measures contrast, it never asserts it (astrobot rule; DESIGN-DNA §1 records the
// WCAG ratios in-comment). This computes the real WCAG 2.1 ratio for every semantic token pair,
// across all 5 accents × light + dark, straight from the oklch token formulas. Fails the build if
// any TEXT pair drops below 4.5:1 or any UI/large pair below 3.0:1 — so the black-on-black class of
// bug can never ship again. Pure math via `culori` (the gate itself must be correct).
import { wcagContrast } from "culori"

const ACCENTS = [
  { id: "Ice", h: 226, c: 0.11 },
  { id: "Iris", h: 292, c: 0.13 },
  { id: "Rose", h: 12, c: 0.15 },
  { id: "Amber", h: 70, c: 0.13 },
  { id: "Jade", h: 158, c: 0.12 },
]

// Token formulas, verbatim from src/globals.css. `H`/`C` resolve to the accent's hue/chroma.
// (l, c, h) — c may be the literal or "C"; h may be the literal or "H".
const TOKENS = {
  light: {
    background: [0.99, 0.004, "H"], foreground: [0.22, 0.012, "H"],
    muted: [0.5, 0.014, "H"], faint: [0.54, 0.014, "H"],
    accentFill: [0.93, 0.016, "H"], primary: [0.56, "C", "H"], primaryInk: [0.99, 0, 0],
    bubbleIn: [0.955, 0.01, "H"], bubbleOut: [0.5, "C", "H"], bubbleOutInk: [0.99, 0, 0],
    accentSolid: [0.5, "C", "H"], accentInk: [0.42, "C", "H"], white: [0.99, 0, 0],
    metalBase: [0.965, 0.008, "H"], card: [1, 0, 0],
  },
  dark: {
    background: [0.155, 0.005, "H"], foreground: [0.96, 0.004, "H"],
    muted: [0.66, 0.012, "H"], faint: [0.6, 0.012, "H"],
    accentFill: [0.255, 0.009, "H"], primary: [0.8, "C", "H"], primaryInk: [0.18, 0.03, "H"],
    bubbleIn: [0.225, 0.006, "H"], bubbleOut: [0.52, "C", "H"], bubbleOutInk: [0.99, 0, 0],
    accentSolid: [0.52, "C", "H"], accentInk: [0.84, "C", "H"], white: [0.99, 0, 0],
    metalBase: [0.19, 0.006, "H"], card: [0.19, 0.006, "H"],
  },
}

// [fgToken, bgToken, minRatio, whatItIs]. 4.5 = normal text; 3.0 = large text / UI element.
const PAIRS = [
  ["foreground", "background", 4.5, "body text on ground"],
  ["muted", "background", 4.5, "muted text (previews, captions)"],
  ["faint", "background", 4.5, "faint meta (timestamps, labels) — real text"],
  ["foreground", "bubbleIn", 4.5, "incoming bubble text"],
  ["bubbleOutInk", "bubbleOut", 4.5, "sent-bubble white ink"],
  ["foreground", "accentFill", 4.5, "selected-row text on grey fill"],
  ["primary", "background", 3.0, "accent icon/fill on ground"],
  ["accentInk", "background", 4.5, "accent TEXT on ground (topics, labels)"],
  ["white", "accentSolid", 4.5, "pill/badge white ink on accent"],
  ["muted", "card", 4.5, "nested block text on card (quote excerpt, reaction count)"],
  ["accentInk", "card", 4.5, "quoted-reply label on card"],
  ["foreground", "metalBase", 4.5, "sidebar text on the metal rail"],
  ["muted", "metalBase", 4.5, "sidebar preview on the metal rail"],
  ["faint", "metalBase", 4.5, "sidebar time/label on the metal rail"],
]

const resolve = ([l, c, h], acc) => ({ mode: "oklch", l, c: c === "C" ? acc.c : c, h: h === "H" ? acc.h : h })

let failures = 0
const rows = []
for (const theme of ["light", "dark"]) {
  for (const acc of ACCENTS) {
    for (const [fg, bg, min, label] of PAIRS) {
      const ratio = wcagContrast(resolve(TOKENS[theme][fg], acc), resolve(TOKENS[theme][bg], acc))
      const pass = ratio >= min
      if (!pass) failures++
      rows.push({ theme, accent: acc.id, pair: label, ratio: ratio.toFixed(2), min: min.toFixed(1), ok: pass })
    }
  }
}

// Report — group the failures up top, then the full matrix.
const bad = rows.filter((r) => !r.ok)
const w = (s, n) => String(s).padEnd(n)
console.log("\n  astro-ui · CONTRAST GATE — WCAG 2.1, all pairs × 5 accents × light/dark\n")
if (bad.length) {
  console.log("  ✗ FAILURES:\n")
  for (const r of bad) console.log(`    ${w(r.theme, 6)} ${w(r.accent, 6)} ${w(r.pair, 34)} ${r.ratio}:1  (need ${r.min}:1)`)
  console.log("")
}
// worst ratio per pair, to see the margins even when passing
const byPair = {}
for (const r of rows) {
  const k = `${r.theme}·${r.pair}`
  if (!byPair[k] || +r.ratio < +byPair[k].ratio) byPair[k] = r
}
console.log("  Tightest ratio per pair (worst accent):\n")
for (const k of Object.keys(byPair)) {
  const r = byPair[k]
  console.log(`    ${r.ok ? "✓" : "✗"} ${w(r.theme, 6)} ${w(r.pair, 34)} ${w(r.ratio + ":1", 8)} (min ${r.min}, worst on ${r.accent})`)
}
console.log(`\n  ${rows.length} checks · ${failures} failing\n`)
process.exit(failures ? 1 : 0)
