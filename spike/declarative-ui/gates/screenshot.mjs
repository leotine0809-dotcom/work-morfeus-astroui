// astro-ui reliability gate — SCREENSHOT / VISUAL REGRESSION (needs the built dist/).
// The last gate: a component the catalog calls `stable` must not change its pixels without someone
// deciding it should. For every contract flagged `stable:true`, it renders the component in
// isolation (lab.html?shot=<Name>&theme=<t>, the deterministic harness in lab.tsx), snapshots it in
// BOTH themes, and pixel-diffs against a committed baseline in gates/baselines/.
//   • no baseline yet        → writes it and reports "baseline created" (first run establishes them)
//   • pixels match           → pass
//   • drift beyond threshold → FAIL, writes gates/diffs/<Name>.<theme>.png (the highlighted diff)
// Update an intentional change with:  UPDATE_SNAPSHOTS=1 node gates/screenshot.mjs
// Run AFTER `npm run build`. `CHROME_PATH` overrides the browser location.
import http from "node:http"
import { readFileSync, existsSync, statSync, createReadStream, readdirSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname, extname } from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer-core"
import { PNG } from "pngjs"
import pixelmatch from "pixelmatch"

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = join(HERE, "..", "dist")
const CONTRACTS = join(HERE, "..", "contracts")
const BASE = join(HERE, "baselines")
const DIFFS = join(HERE, "diffs")
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe"
const UPDATE = !!process.env.UPDATE_SNAPSHOTS
const THEMES = ["dark", "light"]
const RATIO_MAX = 0.002 // >0.2% of pixels differing = real visual drift (absorbs AA jitter)

if (!existsSync(DIST)) { console.error("  screenshot gate: dist/ missing — run `npm run build` first."); process.exit(2) }
if (!existsSync(CHROME)) { console.error(`  screenshot gate: Chrome not found at ${CHROME} (set CHROME_PATH).`); process.exit(2) }
mkdirSync(BASE, { recursive: true })

// the stable set = every contract that vouches `stable:true`
const stable = readdirSync(CONTRACTS)
  .filter((f) => f.endsWith(".contract.json"))
  .map((f) => JSON.parse(readFileSync(join(CONTRACTS, f), "utf8")))
  .filter((c) => c.stable === true)
  .map((c) => c.component)
  .sort()

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png" }
const server = http.createServer((req, res) => {
  const p = decodeURIComponent((req.url || "/").split("?")[0])
  let file = join(DIST, p === "/" ? "/index.html" : p)
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html")
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" })
  createReadStream(file).pipe(res)
})

const fail = []
const created = []
const checked = []
let browser
try {
  const port = await new Promise((r) => server.listen(0, () => r(server.address().port)))
  browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1"] })
  const page = await browser.newPage()
  await page.setViewport({ width: 480, height: 400, deviceScaleFactor: 1 })

  for (const name of stable) {
    for (const theme of THEMES) {
      const url = `http://localhost:${port}/lab.html?shot=${encodeURIComponent(name)}&theme=${theme}`
      await page.goto(url, { waitUntil: "load" })
      const el = await page.waitForSelector("[data-shot]", { timeout: 15000 }).catch(() => null)
      if (!el) { fail.push(`${name} [${theme}]: harness did not render (no SHOTS entry?)`); continue }
      await page.evaluate(async () => { try { await document.fonts.ready } catch {} })
      await new Promise((r) => setTimeout(r, 120)) // let webfont paint settle
      const buf = await el.screenshot({ type: "png" })

      const baseFile = join(BASE, `${name}.${theme}.png`)
      if (UPDATE || !existsSync(baseFile)) {
        writeFileSync(baseFile, buf)
        created.push(`${name}.${theme}`)
        continue
      }
      const cur = PNG.sync.read(Buffer.from(buf))
      const ref = PNG.sync.read(readFileSync(baseFile))
      if (cur.width !== ref.width || cur.height !== ref.height) {
        fail.push(`${name} [${theme}]: size changed ${ref.width}×${ref.height} → ${cur.width}×${cur.height}`)
        continue
      }
      const diff = new PNG({ width: cur.width, height: cur.height })
      const bad = pixelmatch(ref.data, cur.data, diff.data, cur.width, cur.height, { threshold: 0.1 })
      const ratio = bad / (cur.width * cur.height)
      checked.push(`${name}.${theme}`)
      if (ratio > RATIO_MAX) {
        mkdirSync(DIFFS, { recursive: true })
        writeFileSync(join(DIFFS, `${name}.${theme}.png`), PNG.sync.write(diff))
        fail.push(`${name} [${theme}]: ${(ratio * 100).toFixed(2)}% of pixels drifted (${bad}px) — see gates/diffs/${name}.${theme}.png; if intended, run with UPDATE_SNAPSHOTS=1`)
      }
    }
  }
} finally {
  if (browser) await browser.close()
  server.close()
}

console.log("\n  astro-ui · SCREENSHOT GATE — visual regression on `stable` components\n")
if (!stable.length) console.log("    (no component is flagged stable:true yet — nothing to guard)\n")
if (created.length) console.log(`    ↑ baselines written (${created.length}): ${created.join(", ")}\n`)
if (fail.length) {
  console.log("  ✗ DRIFT:\n")
  for (const f of fail) console.log(`    • ${f}`)
  console.log("")
  process.exit(1)
}
console.log(`    ✓ ${checked.length} snapshot(s) match baseline${created.length ? ` · ${created.length} new baseline(s) recorded` : ""} · ${stable.length} stable component(s)\n`)
process.exit(0)
