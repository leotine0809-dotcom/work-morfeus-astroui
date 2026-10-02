// astro-ui reliability gate — RESPONSIVE + A11Y (needs the built dist/).
// Serves dist/ and drives real Chrome (puppeteer-core + the system browser):
//   • RESPONSIVE — at 320/768/1180/1440 the page body must NOT scroll sideways (astrobot "nothing
//     trims"), and the app must actually render (thread + composer present).
//   • A11Y — axe-core (WCAG 2 A/AA) at desktop, dark + light; fails on serious/critical violations.
// Run AFTER `npm run build` (it reads dist/). `CHROME_PATH` overrides the browser location.
import http from "node:http"
import { readFileSync, existsSync, statSync, createReadStream } from "node:fs"
import { join, dirname, extname } from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer-core"

const HERE = dirname(fileURLToPath(import.meta.url))
const DIST = join(HERE, "..", "dist")
const AXE = join(HERE, "..", "node_modules", "axe-core", "axe.min.js")
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe"
const WIDTHS = [320, 768, 1180, 1440]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

if (!existsSync(DIST)) { console.error("  browser gate: dist/ missing — run `npm run build` first."); process.exit(2) }
if (!existsSync(CHROME)) { console.error(`  browser gate: Chrome not found at ${CHROME} (set CHROME_PATH).`); process.exit(2) }

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png" }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || "/").split("?")[0])
  let file = join(DIST, p === "/" ? "/index.html" : p)
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html") // SPA fallback
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" })
  createReadStream(file).pipe(res)
})

const fail = []
let browser
let heroReport = null
let heroAxe = null
let featuresReport = null
let featuresAxe = null
let pricingReport = null
let pricingAxe = null
let faqReport = null
let faqAxe = null
let ctaReport = null
let ctaAxe = null
let navReport = null
let navAxe = null
let footerReport = null
let footerAxe = null
let testimonialsReport = null
let testimonialsAxe = null
try {
  const port = await new Promise((r) => server.listen(0, () => r(server.address().port)))
  const base = `http://localhost:${port}/`
  browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--hide-scrollbars"] })
  const page = await browser.newPage()
  const axeSrc = readFileSync(AXE, "utf8")

  // ── responsive: no horizontal overflow at any width ──
  for (const w of WIDTHS) {
    await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await page.goto(base, { waitUntil: "load" })
    await page.waitForSelector('[data-slot="composer"]', { timeout: 15000 })
    const r = await page.evaluate(() => {
      const de = document.documentElement
      const over = de.scrollWidth - de.clientWidth
      // widest offending element, for a useful message
      let widest = null, max = 0
      for (const el of document.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect()
        if (rect.right - innerWidth > max) { max = rect.right - innerWidth; widest = el.className || el.tagName }
      }
      return { over, widest: max > 1 ? String(widest).slice(0, 60) : null,
        hasComposer: !!document.querySelector('[data-slot="composer"]'), hasBubble: !!document.querySelector('[data-slot="message-bubble"]') }
    })
    if (r.over > 1) fail.push(`responsive @${w}px: body scrolls sideways by ${r.over}px (widest: ${r.widest})`)
    if (!r.hasComposer || !r.hasBubble) fail.push(`responsive @${w}px: app did not render (composer:${r.hasComposer} bubble:${r.hasBubble})`)
  }

  // ── a11y: axe WCAG2 A/AA at desktop, dark THEN light ──
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  for (const mode of ["dark", "light"]) {
    await page.evaluateOnNewDocument((m) => { try { localStorage.setItem("astrochat.mode", m) } catch {} }, mode)
    await page.goto(base, { waitUntil: "load" })
    await page.waitForSelector('[data-slot="composer"]', { timeout: 15000 })
    await page.addScriptTag({ content: axeSrc })
    const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }))
    for (const v of res.violations) {
      if (v.impact === "serious" || v.impact === "critical") {
        fail.push(`a11y [${mode}] ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length}×, e.g. ${(v.nodes[0]?.target || []).join(" ")})`)
      }
    }
    // "couldn't verify" is NOT automatically "accessible": axe can't compute contrast over a
    // gradient/image background, so it parks those in `incomplete`. The brushed-metal sidebar is a
    // SANCTIONED gradient whose text is proven AA by the static contrast gate (metalBase pairs); any
    // OTHER unverifiable element (like the old brain card) is a real hole → fail. So we fail only on
    // incomplete text that is NOT inside `.sidebar`.
    const targets = res.incomplete.filter((v) => v.id === "color-contrast")
      .flatMap((v) => v.nodes.map((n) => (Array.isArray(n.target) ? n.target[0] : n.target)))
      .filter((t) => typeof t === "string")
    const outside = await page.evaluate((ts) => {
      const out = []
      for (const t of ts) {
        try {
          const el = document.querySelector(t)
          if (!el) continue
          if (el.closest(".sidebar")) continue                       // sanctioned metal gradient (verified statically)
          if (el.closest('[aria-hidden="true"]')) continue           // decorative text (e.g. avatar initials) — WCAG contrast N/A
          out.push(t)
        } catch {}
      }
      return out
    }, targets)
    if (outside.length) {
      fail.push(`a11y [${mode}] UNVERIFIABLE contrast on ${outside.length} element(s) OUTSIDE the metal sidebar (gradient/image bg hiding text) — e.g. ${outside[0]}. Give it a solid background-color.`)
    }
  }

  // ── HERO SURFACE (phase 33 t5) — a SECOND, additive pass on lab.html?surface=hero ──
  // Additive: the index.html composer/bubble checks above are untouched. Runs on its OWN tab so it
  // does not inherit the app a11y loop's evaluateOnNewDocument theme scripts. The surface renders the
  // three product Heroes (each [data-slot="hero"]) as the whole page — an isolated Hero target.
  const heroBase = `${base}lab.html?surface=hero&lang=it`
  const heroPage = await browser.newPage()
  heroReport = { overflow: {}, structure: null }

  // responsive (C1 / rule 1): [data-slot="hero"] must render and the surface must NOT scroll
  // sideways (scrollWidth - clientWidth <= 1) at every width.
  for (const w of WIDTHS) {
    await heroPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await heroPage.goto(heroBase, { waitUntil: "load" })
    await heroPage.waitForSelector('[data-slot="hero"]', { timeout: 15000 })
    const r = await heroPage.evaluate(() => {
      const de = document.documentElement
      const over = de.scrollWidth - de.clientWidth
      let widest = null, max = 0
      for (const el of document.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect()
        if (rect.right - innerWidth > max) { max = rect.right - innerWidth; widest = el.className || el.tagName }
      }
      return { over, widest: max > 1 ? String(widest).slice(0, 60) : null, heroes: document.querySelectorAll('[data-slot="hero"]').length }
    })
    heroReport.overflow[w] = r.over
    if (!r.heroes) fail.push(`hero @${w}px: no [data-slot="hero"] rendered`)
    if (r.over > 1) fail.push(`hero @${w}px: surface scrolls sideways by ${r.over}px (widest: ${r.widest})`)
  }

  // C6 structural check (rule 2): the Hero must be a genuinely DIFFERENT view narrow vs wide, not
  // one reflow. Capture DOM order + geometric relationship (text block vs media slot) at 320 and
  // 1180; if the tuple is identical (same order AND same relative geometry) the "two views" are one.
  const heroSig = async (w) => {
    await heroPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await heroPage.goto(heroBase, { waitUntil: "load" })
    await heroPage.waitForSelector('[data-slot="hero-media"]', { timeout: 15000 })
    return await heroPage.evaluate(() => {
      const hero = document.querySelector('[data-slot="hero"]')
      const media = hero.querySelector('[data-slot="hero-media"]')
      const text = media.previousElementSibling
      const order = text.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING ? "text→media" : "media→text"
      const t = text.getBoundingClientRect(), m = media.getBoundingClientRect()
      // relative geometry of the media slot to the text block
      const geom = m.left >= t.right - 4 ? "beside" : m.top >= t.bottom - 4 ? "below" : "overlap"
      return { order, geom }
    })
  }
  const s320 = await heroSig(320)
  const s1180 = await heroSig(1180)
  heroReport.structure = { s320, s1180 }
  if (s320.order === s1180.order && s320.geom === s1180.geom) {
    fail.push(`hero structural: identical view at 320 and 1180 (order:${s320.order} geom:${s320.geom}) — rule 2 wants a real restructure, not one reflow`)
  }

  // a11y (C6 / rule 6): axe WCAG2 A/AA on the Hero surface at desktop, dark THEN light — zero
  // serious/critical. Theme is driven via localStorage("astrochat.mode"), the same mechanism the
  // app a11y pass uses (the surface reads it to toggle .dark).
  await heroPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  heroAxe = {}
  for (const mode of ["dark", "light"]) {
    await heroPage.evaluateOnNewDocument((m) => { try { localStorage.setItem("astrochat.mode", m) } catch {} }, mode)
    await heroPage.goto(heroBase, { waitUntil: "load" })
    await heroPage.waitForSelector('[data-slot="hero"]', { timeout: 15000 })
    await heroPage.addScriptTag({ content: axeSrc })
    const res = await heroPage.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }))
    const serious = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    heroAxe[mode] = serious.length
    for (const v of serious) {
      fail.push(`hero a11y [${mode}] ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length}×, e.g. ${(v.nodes[0]?.target || []).join(" ")})`)
    }
  }
  await heroPage.close()

  // ── FEATURES SURFACE (phase 34 t5) — a THIRD, additive pass on lab.html?surface=features ──
  // Additive: the index.html app checks AND the Hero surface pass above are untouched, so phase-32
  // and phase-33 coverage do not regress. Runs on its OWN tab. The surface renders the three product
  // FeatureGrids (each [data-slot="feature-grid"]) as the whole page — an isolated FeatureGrid target.
  const featBase = `${base}lab.html?surface=features&lang=it`
  const featPage = await browser.newPage()
  featuresReport = { overflow: {}, structure: null }

  // responsive (C9 / rule 1): [data-slot="feature-grid"] must render and the surface must NOT scroll
  // sideways (scrollWidth - clientWidth <= 1) at every width.
  for (const w of WIDTHS) {
    await featPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await featPage.goto(featBase, { waitUntil: "load" })
    await featPage.waitForSelector('[data-slot="feature-grid"]', { timeout: 15000 })
    const r = await featPage.evaluate(() => {
      const de = document.documentElement
      const over = de.scrollWidth - de.clientWidth
      let widest = null, max = 0
      for (const el of document.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect()
        if (rect.right - innerWidth > max) { max = rect.right - innerWidth; widest = el.className || el.tagName }
      }
      return { over, widest: max > 1 ? String(widest).slice(0, 60) : null, grids: document.querySelectorAll('[data-slot="feature-grid"]').length }
    })
    featuresReport.overflow[w] = r.over
    if (!r.grids) fail.push(`features @${w}px: no [data-slot="feature-grid"] rendered`)
    if (r.over > 1) fail.push(`features @${w}px: surface scrolls sideways by ${r.over}px (widest: ${r.widest})`)
  }

  // C7 structural check (rule 2): each feature item must be a genuinely DIFFERENT view narrow vs
  // wide, not one reflow. For ONE [data-slot="feature-item"] capture the geometric relationship of
  // its [data-slot="feature-icon"] to its [data-slot="feature-title"] at 320 and 1180: narrow must be
  // icon-LEFT-of-title (icon.x < title.x, roughly same row), wide must be icon-ABOVE-title
  // (icon.y < title.y, stacked). FAIL if the relationship is identical at both widths.
  const featSig = async (w) => {
    await featPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await featPage.goto(featBase, { waitUntil: "load" })
    await featPage.waitForSelector('[data-slot="feature-title"]', { timeout: 15000 })
    return await featPage.evaluate(() => {
      const item = document.querySelector('[data-slot="feature-item"]')
      const icon = item.querySelector('[data-slot="feature-icon"]')
      const title = item.querySelector('[data-slot="feature-title"]')
      const a = icon.getBoundingClientRect(), b = title.getBoundingClientRect()
      // icon above title (stacked) vs icon left of title (same row)
      const rel = a.bottom <= b.top + 4 ? "above" : a.right <= b.left + 4 ? "left" : "overlap"
      return { rel, ix: Math.round(a.left), iy: Math.round(a.top), tx: Math.round(b.left), ty: Math.round(b.top) }
    })
  }
  const f320 = await featSig(320)
  const f1180 = await featSig(1180)
  featuresReport.structure = { f320, f1180 }
  if (f320.rel === f1180.rel) {
    fail.push(`features structural: identical view at 320 and 1180 (rel:${f320.rel}) — rule 2 wants a real icon<->title reorder, not one reflow`)
  } else {
    if (f320.rel !== "left") fail.push(`features structural @320: expected icon LEFT of title (same row), got rel:${f320.rel} (icon.x ${f320.ix} vs title.x ${f320.tx})`)
    if (f1180.rel !== "above") fail.push(`features structural @1180: expected icon ABOVE title (stacked), got rel:${f1180.rel} (icon.y ${f1180.iy} vs title.y ${f1180.ty})`)
  }

  // a11y (C9 / rule 6): axe WCAG2 A/AA on the FeatureGrid surface at desktop, dark THEN light — zero
  // serious/critical. Theme is driven via localStorage("astrochat.mode"), the same mechanism the app
  // and Hero passes use (the surface reads it to toggle .dark).
  await featPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  featuresAxe = {}
  for (const mode of ["dark", "light"]) {
    await featPage.evaluateOnNewDocument((m) => { try { localStorage.setItem("astrochat.mode", m) } catch {} }, mode)
    await featPage.goto(featBase, { waitUntil: "load" })
    await featPage.waitForSelector('[data-slot="feature-grid"]', { timeout: 15000 })
    await featPage.addScriptTag({ content: axeSrc })
    const res = await featPage.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }))
    const serious = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    featuresAxe[mode] = serious.length
    for (const v of serious) {
      fail.push(`features a11y [${mode}] ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length}×, e.g. ${(v.nodes[0]?.target || []).join(" ")})`)
    }
  }
  await featPage.close()

  // ── PRICING SURFACE (phase 35 t5) — a FOURTH, additive pass on lab.html?surface=pricing ──
  // Additive: the index.html app checks AND the Hero + Features surface passes above are untouched,
  // so phase-32/33/34 coverage does not regress. Runs on its OWN tab. The surface renders the three
  // product Pricings (each [data-slot="pricing"]) as the whole page — an isolated Pricing target.
  // Pricing is the FIRST interactive component, so its billing toggle is exercised as LIVE behaviour
  // (click + keyboard), not just inspected as markup.
  const priceBase = `${base}lab.html?surface=pricing&lang=it`
  const pricePage = await browser.newPage()
  pricingReport = { overflow: {}, overflowAnnual: {}, reorder: null, priceSwitch: null, keyboard: null }

  // helpers on the pricing page
  const measureOverflow = () =>
    pricePage.evaluate(() => {
      const de = document.documentElement
      const over = de.scrollWidth - de.clientWidth
      let widest = null, max = 0
      for (const el of document.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect()
        if (rect.right - innerWidth > max) { max = rect.right - innerWidth; widest = el.className || el.tagName }
      }
      return { over, widest: max > 1 ? String(widest).slice(0, 60) : null, count: document.querySelectorAll('[data-slot="pricing"]').length }
    })
  // click the LAST option (annual) inside EVERY billing toggle group, so every plan's price flips
  const clickBilling = (which) =>
    pricePage.$$eval('[data-slot="billing-toggle"]', (groups, which) => {
      for (const g of groups) {
        const btns = g.querySelectorAll("button")
        ;(which === "annual" ? btns[btns.length - 1] : btns[0]).click()
      }
    }, which)
  const allPrices = () =>
    pricePage.$$eval('[data-slot="plan-price"]', (els) => els.map((e) => (e.textContent || "").trim()))
  const firstSectionPrices = () =>
    pricePage.evaluate(() => {
      const s = document.querySelector('[data-slot="pricing"]')
      return [...s.querySelectorAll('[data-slot="plan-price"]')].map((e) => (e.textContent || "").trim())
    })

  // responsive (C10 / rule 1) in BOTH billing states: at every width the surface must NOT scroll
  // sideways (scrollWidth - clientWidth <= 1) in the default monthly state AND after toggling every
  // group into annual (the longer annual price strings must not push content off-screen).
  for (const w of WIDTHS) {
    await pricePage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await pricePage.goto(priceBase, { waitUntil: "load" })
    await pricePage.waitForSelector('[data-slot="pricing"]', { timeout: 15000 })
    const m = await measureOverflow()
    pricingReport.overflow[w] = m.over
    if (!m.count) fail.push(`pricing @${w}px: no [data-slot="pricing"] rendered`)
    if (m.over > 1) fail.push(`pricing @${w}px [monthly]: surface scrolls sideways by ${m.over}px (widest: ${m.widest})`)
    await clickBilling("annual")
    const a = await measureOverflow()
    pricingReport.overflowAnnual[w] = a.over
    if (a.over > 1) fail.push(`pricing @${w}px [annual]: surface scrolls sideways by ${a.over}px (widest: ${a.widest})`)
  }

  // live price switch (C5): read every plan price in the default state, click every toggle into
  // annual, re-read — EVERY plan's price must change (monthly → annual); click back to monthly and
  // assert it reverts. Driven by internal state (never both price sets visible at once).
  await pricePage.setViewport({ width: 1180, height: 900, deviceScaleFactor: 1 })
  await pricePage.goto(priceBase, { waitUntil: "load" })
  await pricePage.waitForSelector('[data-slot="plan-price"]', { timeout: 15000 })
  const pMonthly = await allPrices()
  await clickBilling("annual")
  const pAnnual = await allPrices()
  await clickBilling("monthly")
  const pReverted = await allPrices()
  const unchanged = pMonthly.map((v, i) => (v === pAnnual[i] ? i : -1)).filter((i) => i >= 0)
  const notReverted = pMonthly.map((v, i) => (v !== pReverted[i] ? i : -1)).filter((i) => i >= 0)
  pricingReport.priceSwitch = {
    count: pMonthly.length,
    example: pMonthly.length ? `${pMonthly[0]}→${pAnnual[0]}` : "(none)",
    ok: pMonthly.length > 0 && unchanged.length === 0 && notReverted.length === 0,
  }
  if (!pMonthly.length) fail.push(`pricing price-switch: no [data-slot="plan-price"] found`)
  if (unchanged.length) fail.push(`pricing price-switch: ${unchanged.length} plan price(s) did NOT change on annual toggle (e.g. index ${unchanged[0]} stayed "${pMonthly[unchanged[0]]}")`)
  if (notReverted.length) fail.push(`pricing price-switch: ${notReverted.length} plan price(s) did NOT revert to monthly (e.g. index ${notReverted[0]})`)

  // keyboard activation + focus-visible (C6): Tab to the annual option of the first toggle, confirm a
  // visible focus-visible indicator, press Enter, and assert the first section's prices flip the same
  // way a pointer click does.
  await pricePage.goto(priceBase, { waitUntil: "load" })
  await pricePage.waitForSelector('[data-slot="billing-toggle"]', { timeout: 15000 })
  const kbBefore = await firstSectionPrices()
  let kbFocus = null
  for (let i = 0; i < 8 && !kbFocus; i++) {
    await pricePage.keyboard.press("Tab")
    const info = await pricePage.evaluate(() => {
      const el = document.activeElement
      const group = el && el.closest ? el.closest('[data-slot="billing-toggle"]') : null
      if (!group) return { inToggle: false }
      const btns = [...group.querySelectorAll("button")]
      const isAnnual = btns[btns.length - 1] === el
      const cs = getComputedStyle(el)
      let focusVisible = false
      try { focusVisible = el.matches(":focus-visible") } catch {}
      const ring = !!cs.boxShadow && cs.boxShadow !== "none"
      return { inToggle: true, isAnnual, focusVisible, ring }
    })
    if (info.inToggle && info.isAnnual) kbFocus = info
  }
  if (!kbFocus) {
    fail.push(`pricing keyboard: could not Tab to the annual option of [data-slot="billing-toggle"]`)
    pricingReport.keyboard = { reached: false, focusVisible: false, flips: false }
  } else {
    const focusOk = kbFocus.focusVisible || kbFocus.ring
    if (!focusOk) fail.push(`pricing keyboard: annual option has no visible focus-visible indicator (focus-visible:${kbFocus.focusVisible} boxShadow-ring:${kbFocus.ring})`)
    await pricePage.keyboard.press("Enter")
    const kbAfter = await firstSectionPrices()
    const flips = kbBefore.length > 0 && kbBefore.every((v, i) => v !== kbAfter[i])
    if (!flips) fail.push(`pricing keyboard: pressing Enter on the annual option did not flip the price (before ${JSON.stringify(kbBefore)} after ${JSON.stringify(kbAfter)})`)
    pricingReport.keyboard = { reached: true, focusVisible: focusOk, flips }
  }

  // highlighted-plan reorder (C9): within the first Pricing section capture the plan cards' geometry
  // at 320 vs 1180. Narrow: the highlighted plan is FIRST (top edge above every sibling). Wide: it is
  // CENTERED among its siblings (not first, not last, by left position) AND lifted (top above them).
  // Its visual reading-order index must DIFFER between the widths — a genuine reorder, not a reflow.
  const planSig = async (w) => {
    await pricePage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await pricePage.goto(priceBase, { waitUntil: "load" })
    await pricePage.waitForSelector('[data-slot="plan-highlighted"]', { timeout: 15000 })
    return await pricePage.evaluate(() => {
      const s = document.querySelector('[data-slot="pricing"]')
      const cards = [...s.querySelectorAll('[data-slot="plan"],[data-slot="plan-highlighted"]')]
      return cards.map((el) => {
        const r = el.getBoundingClientRect()
        return { hl: el.getAttribute("data-slot") === "plan-highlighted", top: Math.round(r.top), left: Math.round(r.left) }
      })
    })
  }
  const g320 = await planSig(320)
  const g1180 = await planSig(1180)
  // narrow reading order = top-to-bottom; wide reading order = left-to-right
  const idxByTop = (g) => [...g].sort((a, b) => a.top - b.top).findIndex((p) => p.hl)
  const idxByLeft = (g) => [...g].sort((a, b) => a.left - b.left).findIndex((p) => p.hl)
  const i320 = idxByTop(g320)
  const i1180 = idxByLeft(g1180)
  const hl1180 = g1180.find((p) => p.hl)
  const others1180 = g1180.filter((p) => !p.hl)
  const lifted = hl1180 && others1180.length > 0 && others1180.every((p) => hl1180.top < p.top)
  pricingReport.reorder = { i320, i1180, lifted, count320: g320.length, count1180: g1180.length }
  if (i320 !== 0) fail.push(`pricing reorder @320: highlighted plan is not FIRST in the stack (reading index ${i320}, expected 0)`)
  if (i1180 <= 0 || i1180 >= g1180.length - 1) fail.push(`pricing reorder @1180: highlighted plan is not CENTERED among siblings (left-order index ${i1180} of ${g1180.length})`)
  if (!lifted) fail.push(`pricing reorder @1180: highlighted plan is not lifted above its flanking siblings (top ${hl1180 ? hl1180.top : "?"} vs others ${JSON.stringify(others1180.map((p) => p.top))})`)
  if (i320 === i1180) fail.push(`pricing reorder: highlighted plan holds the same order index (${i320}) at 320 and 1180 — rule 2 wants a genuine reorder, not a column-count change`)

  // a11y (C6/C11): axe WCAG2 A/AA on the Pricing surface at desktop, dark THEN light, in BOTH billing
  // states — zero serious/critical in every (theme × billing) combination. Theme via
  // localStorage("astrochat.mode"), the same mechanism the other passes use.
  await pricePage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  pricingAxe = {}
  const runAxe = () =>
    pricePage.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }))
  const collect = (res, label) => {
    const serious = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    for (const v of serious) {
      fail.push(`pricing a11y [${label}] ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length}×, e.g. ${(v.nodes[0]?.target || []).join(" ")})`)
    }
    return serious.length
  }
  for (const mode of ["dark", "light"]) {
    await pricePage.evaluateOnNewDocument((m) => { try { localStorage.setItem("astrochat.mode", m) } catch {} }, mode)
    await pricePage.goto(priceBase, { waitUntil: "load" })
    await pricePage.waitForSelector('[data-slot="pricing"]', { timeout: 15000 })
    await pricePage.addScriptTag({ content: axeSrc })
    const monthlyCount = collect(await runAxe(), `${mode}/monthly`)
    await clickBilling("annual")
    const annualCount = collect(await runAxe(), `${mode}/annual`)
    pricingAxe[mode] = { monthly: monthlyCount, annual: annualCount }
  }
  await pricePage.close()

  // ── FAQ SURFACE (phase 36 t6) — a FIFTH, additive pass on lab.html?surface=faq ──
  // Additive: the index.html app checks AND the Hero + Features + Pricing surface passes above are
  // untouched, so phase-32/33/34/35 coverage does not regress. Runs on its OWN tab. The surface
  // renders the three product FAQs (each [data-slot="faq"]) as the whole page — an isolated FAQ
  // target. FAQ is the SECOND interactive component (the narrow view holds open/closed accordion
  // state), so its accordion is exercised as LIVE behaviour (click + keyboard), not just markup.
  // Because the component renders BOTH view branches (narrow collapsible accordion + wide always-open
  // grid) and hides one with a @container query, every check is scoped to the VISIBLE branch at that
  // width (elements with a layout box: offsetParent !== null / non-empty getClientRects), so the
  // display:none branch is ignored.
  const faqBase = `${base}lab.html?surface=faq&lang=it`
  const faqPage = await browser.newPage()
  faqReport = { overflow: {}, overflowExpanded: {}, twoView: null, singleOpen: null, keyboard: null }

  // helpers on the faq page
  const measureFaqOverflow = () =>
    faqPage.evaluate(() => {
      const de = document.documentElement
      const over = de.scrollWidth - de.clientWidth
      let widest = null, max = 0
      for (const el of document.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect()
        if (rect.right - innerWidth > max) { max = rect.right - innerWidth; widest = el.className || el.tagName }
      }
      return { over, widest: max > 1 ? String(widest).slice(0, 60) : null, count: document.querySelectorAll('[data-slot="faq"]').length }
    })
  // expand the FIRST visible (narrow-branch) question trigger inside EVERY faq section, revealing its
  // long answer (so overflow / axe see a wide-open expanded state, not just collapsed).
  const expandFirstEach = () =>
    faqPage.$$eval('[data-slot="faq"]', (sections) => {
      let n = 0
      for (const s of sections) {
        const qs = [...s.querySelectorAll('button[data-slot="faq-question"]')].filter((el) => el.offsetParent !== null && el.getClientRects().length)
        if (qs[0]) { qs[0].click(); n++ }
      }
      return n
    })
  // click the Nth narrow-branch trigger of the FIRST faq section
  const clickNarrow = (n) =>
    faqPage.evaluate((n) => {
      const s = document.querySelector('[data-slot="faq"]')
      const narrow = [...s.querySelectorAll('[data-slot="faq-item"]')].filter((it) => it.querySelector('button[data-slot="faq-question"]'))
      const btn = narrow[n] && narrow[n].querySelector('button[data-slot="faq-question"]')
      if (btn) { btn.click(); return true }
      return false
    }, n)
  // read the Nth narrow-branch item's answer (visible? + text) of the FIRST faq section
  const readNarrow = (n) =>
    faqPage.evaluate((n) => {
      const vis = (el) => {
        if (!el || el.offsetParent === null || !el.getClientRects().length) return false
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
        return r.height >= 1 && r.width >= 1 && cs.display !== "none" && cs.visibility !== "hidden"
      }
      const s = document.querySelector('[data-slot="faq"]')
      const narrow = [...s.querySelectorAll('[data-slot="faq-item"]')].filter((it) => it.querySelector('button[data-slot="faq-question"]'))
      const it = narrow[n]
      const ans = it ? it.querySelector('[data-slot="faq-answer"]') : null
      return { visible: vis(ans), text: ans ? (ans.textContent || "").trim() : "" }
    }, n)

  // ── responsive (C10 / rule 1), collapsed AND expanded: at every width the surface must NOT scroll
  // sideways (scrollWidth - clientWidth <= 1) with all items collapsed; then on the NARROW widths
  // (320, 768) reveal each section's first (long) answer and re-measure, still <= 1. ──
  for (const w of WIDTHS) {
    await faqPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await faqPage.goto(faqBase, { waitUntil: "load" })
    await faqPage.waitForSelector('[data-slot="faq"]', { timeout: 15000 })
    const m = await measureFaqOverflow()
    faqReport.overflow[w] = m.over
    if (!m.count) fail.push(`faq @${w}px: no [data-slot="faq"] rendered`)
    if (m.over > 1) fail.push(`faq @${w}px [collapsed]: surface scrolls sideways by ${m.over}px (widest: ${m.widest})`)
    if (w === 320 || w === 768) {
      await expandFirstEach()
      await sleep(150)
      const e = await measureFaqOverflow()
      faqReport.overflowExpanded[w] = e.over
      if (e.over > 1) fail.push(`faq @${w}px [expanded]: surface scrolls sideways by ${e.over}px (widest: ${e.widest})`)
    }
  }

  // ── two-view visibility (C7 / rule 2): the FIRST item's answer must be HIDDEN-until-expand at 320
  // (single column) but VISIBLE with NO interaction at 1180 (2-column always-open grid). FAIL if the
  // load visibility is identical at both widths (collapsible-at-both / always-open-at-both), or the
  // wide view is not 2-column. ──
  const twoViewProbe = () =>
    faqPage.evaluate(() => {
      const vis = (el) => {
        if (!el || el.offsetParent === null || !el.getClientRects().length) return false
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
        return r.height >= 1 && r.width >= 1 && cs.display !== "none" && cs.visibility !== "hidden"
      }
      const s = document.querySelector('[data-slot="faq"]')
      const items = [...s.querySelectorAll('[data-slot="faq-item"]')].filter((it) => it.offsetParent !== null && it.getClientRects().length)
      const first = items[0]
      const ans = first ? first.querySelector('[data-slot="faq-answer"]') : null
      const rects = items.map((it) => it.getBoundingClientRect())
      let sameRow = false
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j]
        if (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4) sameRow = true
      }
      return { answerVisible: vis(ans), cols: sameRow ? 2 : 1, items: items.length }
    })
  await faqPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
  await faqPage.goto(faqBase, { waitUntil: "load" })
  await faqPage.waitForSelector('[data-slot="faq-item"]', { timeout: 15000 })
  const tv320 = await twoViewProbe()
  await clickNarrow(0)
  await sleep(150)
  const tv320Revealed = (await readNarrow(0)).visible
  await faqPage.setViewport({ width: 1180, height: 900, deviceScaleFactor: 1 })
  await faqPage.goto(faqBase, { waitUntil: "load" })
  await faqPage.waitForSelector('[data-slot="faq-item"]', { timeout: 15000 })
  const tv1180 = await twoViewProbe()
  faqReport.twoView = {
    hidden320: !tv320.answerVisible, revealed320: tv320Revealed, cols320: tv320.cols,
    visible1180: tv1180.answerVisible, cols1180: tv1180.cols,
  }
  if (tv320.answerVisible) fail.push(`faq two-view @320: first answer is visible BEFORE interaction (narrow view must collapse answers until a trigger is activated)`)
  if (!tv320Revealed) fail.push(`faq two-view @320: first answer did not become visible after activating its trigger`)
  if (tv320.cols !== 1) fail.push(`faq two-view @320: items are not a single column (detected ${tv320.cols} columns)`)
  if (!tv1180.answerVisible) fail.push(`faq two-view @1180: first answer is not visible without interaction (wide view must be always-open)`)
  if (tv1180.cols < 2) fail.push(`faq two-view @1180: wide view is not 2-column always-open (detected ${tv1180.cols} column)`)
  if (tv320.answerVisible === tv1180.answerVisible) fail.push(`faq two-view: first answer has IDENTICAL load visibility at 320 and 1180 — rule 2 wants collapsible-narrow vs always-open-wide, not one model at both widths`)

  // ── single-open local state (C5): at 320, expand item 1 (answer visible), then item 2 → item 2 is
  // open AND item 1 collapsed back (single-open); re-activate item 2 → it collapses (none open). The
  // revealed answer text is exactly the declared copy (compared against the always-mounted wide
  // branch's answer text for the same item index). ──
  await faqPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
  await faqPage.goto(faqBase, { waitUntil: "load" })
  await faqPage.waitForSelector('button[data-slot="faq-question"]', { timeout: 15000 })
  const expectedTexts = await faqPage.evaluate(() => {
    const s = document.querySelector('[data-slot="faq"]')
    const wide = [...s.querySelectorAll('[data-slot="faq-item"]')].filter((it) => it.querySelector('h3[data-slot="faq-question"]'))
    return wide.map((it) => { const a = it.querySelector('[data-slot="faq-answer"]'); return a ? (a.textContent || "").trim() : "" })
  })
  await clickNarrow(0)
  await sleep(150)
  const so0 = await readNarrow(0)
  await clickNarrow(1)
  await sleep(150)
  const soAfter0 = await readNarrow(0)
  const soAfter1 = await readNarrow(1)
  await clickNarrow(1)
  await sleep(150)
  const soClose1 = await readNarrow(1)
  const textOk = so0.text === expectedTexts[0] && soAfter1.text === expectedTexts[1]
  faqReport.singleOpen = {
    open0: so0.visible, closed0AfterOpen1: !soAfter0.visible, open1: soAfter1.visible, collapsed1: !soClose1.visible, textOk,
  }
  if (!so0.visible) fail.push(`faq single-open: item 1 answer did not open on click`)
  if (soAfter0.visible) fail.push(`faq single-open: item 1 answer stayed open when item 2 was opened (multi-open, expected single-open)`)
  if (!soAfter1.visible) fail.push(`faq single-open: item 2 answer did not open on click`)
  if (soClose1.visible) fail.push(`faq single-open: item 2 answer did not collapse when its trigger was re-activated`)
  if (!textOk) fail.push(`faq single-open: revealed answer text is not the declared copy (got "${so0.text.slice(0, 40)}" / "${soAfter1.text.slice(0, 40)}")`)

  // ── keyboard operability + focus-visible (C6): at 320, Tab to a [data-slot="faq-question"] trigger,
  // assert a visible focus-visible indicator (`:focus-visible` match or a non-none boxShadow ring),
  // then Enter opens (aria-expanded true) and Space closes (aria-expanded false) the same way a click
  // does. ──
  await faqPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
  await faqPage.goto(faqBase, { waitUntil: "load" })
  await faqPage.waitForSelector('button[data-slot="faq-question"]', { timeout: 15000 })
  let faqKb = null
  for (let i = 0; i < 12 && !faqKb; i++) {
    await faqPage.keyboard.press("Tab")
    const info = await faqPage.evaluate(() => {
      const el = document.activeElement
      if (!el || el.getAttribute("data-slot") !== "faq-question" || el.tagName !== "BUTTON") return { onTrigger: false }
      const cs = getComputedStyle(el)
      let focusVisible = false
      try { focusVisible = el.matches(":focus-visible") } catch {}
      return { onTrigger: true, focusVisible, ring: !!cs.boxShadow && cs.boxShadow !== "none", expanded: el.getAttribute("aria-expanded") }
    })
    if (info.onTrigger) faqKb = info
  }
  if (!faqKb) {
    fail.push(`faq keyboard: could not Tab to a [data-slot="faq-question"] trigger`)
    faqReport.keyboard = { reached: false, focusVisible: false, enterToggles: false, spaceToggles: false }
  } else {
    const focusOk = faqKb.focusVisible || faqKb.ring
    if (!focusOk) fail.push(`faq keyboard: focused trigger has no visible focus-visible indicator (focus-visible:${faqKb.focusVisible} boxShadow-ring:${faqKb.ring})`)
    const readExpanded = () => faqPage.evaluate(() => { const el = document.activeElement; return el ? el.getAttribute("aria-expanded") : null })
    const before = await readExpanded()
    await faqPage.keyboard.press("Enter")
    await sleep(150)
    const afterEnter = await readExpanded()
    await faqPage.keyboard.press(" ")
    await sleep(150)
    const afterSpace = await readExpanded()
    const enterToggles = before === "false" && afterEnter === "true"
    const spaceToggles = afterEnter === "true" && afterSpace === "false"
    if (!enterToggles) fail.push(`faq keyboard: Enter did not toggle aria-expanded open (before ${before} after ${afterEnter})`)
    if (!spaceToggles) fail.push(`faq keyboard: Space did not toggle aria-expanded closed (afterEnter ${afterEnter} afterSpace ${afterSpace})`)
    faqReport.keyboard = { reached: true, focusVisible: focusOk, enterToggles, spaceToggles }
  }

  // ── axe A/AA (C6/C11), both themes × (narrow collapsed, narrow expanded, wide desktop): zero
  // serious/critical in every combination. Theme via localStorage("astrochat.mode"), the same
  // mechanism the other passes use. ──
  faqAxe = {}
  const runFaqAxe = () =>
    faqPage.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }))
  const collectFaq = (res, label) => {
    const serious = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    for (const v of serious) {
      fail.push(`faq a11y [${label}] ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length}×, e.g. ${(v.nodes[0]?.target || []).join(" ")})`)
    }
    return serious.length
  }
  for (const mode of ["dark", "light"]) {
    await faqPage.evaluateOnNewDocument((m) => { try { localStorage.setItem("astrochat.mode", m) } catch {} }, mode)
    // narrow, collapsed
    await faqPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
    await faqPage.goto(faqBase, { waitUntil: "load" })
    await faqPage.waitForSelector('[data-slot="faq"]', { timeout: 15000 })
    await faqPage.addScriptTag({ content: axeSrc })
    const collapsed = collectFaq(await runFaqAxe(), `${mode}/narrow-collapsed`)
    // narrow, expanded
    await expandFirstEach()
    await sleep(150)
    const expanded = collectFaq(await runFaqAxe(), `${mode}/narrow-expanded`)
    // wide, always-open desktop grid
    await faqPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await faqPage.goto(faqBase, { waitUntil: "load" })
    await faqPage.waitForSelector('[data-slot="faq"]', { timeout: 15000 })
    await faqPage.addScriptTag({ content: axeSrc })
    const wide = collectFaq(await runFaqAxe(), `${mode}/wide`)
    faqAxe[mode] = { collapsed, expanded, wide }
  }
  await faqPage.close()

  // ── CTA SURFACE (phase 37 t5) — a SIXTH, additive pass on lab.html?surface=cta ──
  // Additive: the index.html app checks AND the Hero + Features + Pricing + FAQ surface passes above
  // are untouched, so phase-32/33/34/35/36 coverage does not regress. Runs on its OWN tab. The
  // surface renders the three product CTASections (each [data-slot="cta"]) as the whole page — an
  // isolated CTASection target. CTASection is non-interactive like the Hero (no live open/close), so
  // this pass inspects overflow, the accent-band recolor, the two-view structural flip, the on-band
  // keyboard/focus recipe, and axe A/AA in both themes.
  const ctaBase = `${base}lab.html?surface=cta&lang=it`
  const ctaPage = await browser.newPage()
  ctaReport = { overflow: {}, structure: null, recolor: null, keyboard: null }

  // responsive (C8 / rule 1): [data-slot="cta"] must render and the surface must NOT scroll sideways
  // (scrollWidth - clientWidth <= 1) at every width. The long title + full-width narrow CTAs (from
  // the t4 surface) are the stress case: they must not push content off-screen.
  for (const w of WIDTHS) {
    await ctaPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await ctaPage.goto(ctaBase, { waitUntil: "load" })
    await ctaPage.waitForSelector('[data-slot="cta"]', { timeout: 15000 })
    const r = await ctaPage.evaluate(() => {
      const de = document.documentElement
      const over = de.scrollWidth - de.clientWidth
      let widest = null, max = 0
      for (const el of document.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect()
        if (rect.right - innerWidth > max) { max = rect.right - innerWidth; widest = el.className || el.tagName }
      }
      return { over, widest: max > 1 ? String(widest).slice(0, 60) : null, ctas: document.querySelectorAll('[data-slot="cta"]').length }
    })
    ctaReport.overflow[w] = r.over
    if (!r.ctas) fail.push(`cta @${w}px: no [data-slot="cta"] rendered`)
    if (r.over > 1) fail.push(`cta @${w}px: surface scrolls sideways by ${r.over}px (widest: ${r.widest})`)
  }

  // accent-band recolor (C5): read the first band's computed background-color and the primaryCta's
  // accent-tracking channel (its computed text color = var(--primary)) at the default accent, then
  // set a DIFFERENT accent on <html> (--acc-h / --acc-c, as the lab's accent knob does) and re-read.
  // The band background MUST change and the primaryCta text color MUST change (both track the
  // accent), while the on-band foreground text stays the paired text-primary-foreground.
  await ctaPage.setViewport({ width: 1180, height: 900, deviceScaleFactor: 1 })
  await ctaPage.goto(ctaBase, { waitUntil: "load" })
  await ctaPage.waitForSelector('[data-slot="cta"]', { timeout: 15000 })
  const readBandColors = () =>
    ctaPage.evaluate(() => {
      const band = document.querySelector('[data-slot="cta"]')
      const actions = band.querySelector('[data-slot="cta-actions"]')
      const primary = actions.querySelector("a")
      const heading = band.querySelector('[data-slot="cta-text"] h2')
      return {
        bandBg: getComputedStyle(band).backgroundColor,
        primaryText: getComputedStyle(primary).color,
        headingColor: getComputedStyle(heading).color,
      }
    })
  const before = await readBandColors()
  // ACCENTS[0] (ice, h226 c0.11) is the surface default; jade (h158 c0.12) is a clearly different hue.
  await ctaPage.evaluate(() => {
    const r = document.documentElement
    r.style.setProperty("--acc-h", "158")
    r.style.setProperty("--acc-c", "0.12")
  })
  await sleep(80)
  const after = await readBandColors()
  const bandRecolors = before.bandBg !== after.bandBg
  const primaryRecolors = before.primaryText !== after.primaryText
  const headingStable = before.headingColor === after.headingColor
  ctaReport.recolor = { bandBg: `${before.bandBg}→${after.bandBg}`, primaryText: `${before.primaryText}→${after.primaryText}`, bandRecolors, primaryRecolors, headingStable }
  if (!bandRecolors) fail.push(`cta accent recolor: band background did not change with the accent (stayed ${before.bandBg}) — a baked hue, not bg-primary`)
  if (!primaryRecolors) fail.push(`cta accent recolor: primaryCta text color did not change with the accent (stayed ${before.primaryText}) — its accent-tracking channel is dead`)

  // structural flip (C6 / rule 2): capture cta-text vs cta-actions geometry at 320 and 1180. At 1180
  // they are SIDE BY SIDE (text box LEFT of actions box, vertical ranges OVERLAP). At 320 they are
  // STACKED (actions box BELOW text box, vertical ranges DO NOT overlap) and the actions block spans
  // (near) the full band inner width (full-width CTAs). FAIL if the arrangement is identical at both.
  const ctaSig = async (w) => {
    await ctaPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await ctaPage.goto(ctaBase, { waitUntil: "load" })
    await ctaPage.waitForSelector('[data-slot="cta-actions"]', { timeout: 15000 })
    return await ctaPage.evaluate(() => {
      const band = document.querySelector('[data-slot="cta"]')
      const text = band.querySelector('[data-slot="cta-text"]')
      const actions = band.querySelector('[data-slot="cta-actions"]')
      const b = band.getBoundingClientRect(), t = text.getBoundingClientRect(), a = actions.getBoundingClientRect()
      const overlapV = Math.min(t.bottom, a.bottom) - Math.max(t.top, a.top) > 4
      const rel = t.right <= a.left + 4 && overlapV ? "beside" : a.top >= t.bottom - 4 && !overlapV ? "stacked" : "overlap"
      // fraction of the band's inner width (band width minus its symmetric padding) the actions span
      const pad = t.left - b.left // left inset of the text block ≈ band padding
      const inner = b.width - pad * 2
      const actionsFrac = inner > 0 ? a.width / inner : 0
      // centered: the text block's left/right insets within the band are ~equal
      const centered = Math.abs((t.left - b.left) - (b.right - t.right)) <= 6
      return { rel, actionsFrac: Math.round(actionsFrac * 100) / 100, centered }
    })
  }
  const c320 = await ctaSig(320)
  const c1180 = await ctaSig(1180)
  ctaReport.structure = { c320, c1180 }
  if (c320.rel === c1180.rel) {
    fail.push(`cta structural: identical view at 320 and 1180 (rel:${c320.rel}) — rule 2 wants a real text<->actions reorder, not one reflow`)
  } else {
    if (c1180.rel !== "beside") fail.push(`cta structural @1180: expected text LEFT of actions (side by side), got rel:${c1180.rel}`)
    if (c320.rel !== "stacked") fail.push(`cta structural @320: expected actions BELOW text (stacked), got rel:${c320.rel}`)
    if (!c320.centered) fail.push(`cta structural @320: text block is not centered within the band (uneven insets)`)
    if (c320.actionsFrac < 0.9) fail.push(`cta structural @320: actions block is not (near) full-width (spans ${Math.round(c320.actionsFrac * 100)}% of the band inner width, expected >= 90%)`)
  }

  // keyboard + focus-visible on the band (C10): Tab to the primaryCta anchor (and the secondaryCta),
  // assert each is reached as an operable anchor carrying its declared href, and shows a visible
  // focus-visible indicator (`:focus-visible` match or a non-none boxShadow ring = the on-band
  // ring-primary-foreground). Mirrors the Pricing/FAQ keyboard probe.
  await ctaPage.setViewport({ width: 1180, height: 900, deviceScaleFactor: 1 })
  await ctaPage.goto(ctaBase, { waitUntil: "load" })
  await ctaPage.waitForSelector('[data-slot="cta-actions"] a', { timeout: 15000 })
  const ctaAnchors = []
  for (let i = 0; i < 12 && ctaAnchors.length < 2; i++) {
    await ctaPage.keyboard.press("Tab")
    const info = await ctaPage.evaluate(() => {
      const el = document.activeElement
      if (!el || el.tagName !== "A" || !el.closest('[data-slot="cta-actions"]')) return { onCta: false }
      const cs = getComputedStyle(el)
      let focusVisible = false
      try { focusVisible = el.matches(":focus-visible") } catch {}
      return { onCta: true, href: el.getAttribute("href"), focusVisible, ring: !!cs.boxShadow && cs.boxShadow !== "none" }
    })
    if (info.onCta) ctaAnchors.push(info)
  }
  if (!ctaAnchors.length) {
    fail.push(`cta keyboard: could not Tab to a [data-slot="cta-actions"] anchor`)
    ctaReport.keyboard = { reached: 0, focusVisible: false, hasHref: false }
  } else {
    const focusOk = ctaAnchors.every((a) => a.focusVisible || a.ring)
    const hrefOk = ctaAnchors.every((a) => typeof a.href === "string" && a.href.length > 0)
    if (!focusOk) fail.push(`cta keyboard: a CTA anchor has no visible focus-visible indicator on the band (focus-visible/boxShadow-ring missing)`)
    if (!hrefOk) fail.push(`cta keyboard: a CTA anchor is not an operable link carrying an href`)
    ctaReport.keyboard = { reached: ctaAnchors.length, focusVisible: focusOk, hasHref: hrefOk }
  }

  // axe A/AA ON the band (C10), both themes: run axe-core (wcag2a/wcag2aa) on the CTA surface at
  // desktop, dark THEN light (theme via localStorage("astrochat.mode"), the same mechanism the other
  // passes use), with both CTAs present on the band — zero serious/critical (text and non-text
  // contrast) in EACH theme. The accent band is the tricky surface: the inverted CTA contrast + focus
  // ring must pass here.
  await ctaPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  ctaAxe = {}
  for (const mode of ["dark", "light"]) {
    await ctaPage.evaluateOnNewDocument((m) => { try { localStorage.setItem("astrochat.mode", m) } catch {} }, mode)
    await ctaPage.goto(ctaBase, { waitUntil: "load" })
    await ctaPage.waitForSelector('[data-slot="cta"]', { timeout: 15000 })
    await ctaPage.addScriptTag({ content: axeSrc })
    const res = await ctaPage.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }))
    const serious = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    ctaAxe[mode] = serious.length
    for (const v of serious) {
      fail.push(`cta a11y [${mode}] ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length}×, e.g. ${(v.nodes[0]?.target || []).join(" ")})`)
    }
  }
  await ctaPage.close()

  // ── NAV SURFACE (phase 38 t5) — a SEVENTH, additive pass on lab.html?surface=nav ──
  // Additive: the index.html app checks AND the Hero + Features + Pricing + FAQ + CTA surface passes
  // above are untouched, so phase-32/33/34/35/36/37 coverage does not regress. Runs on its OWN tab.
  // The surface renders the three product MarketingNavs (each [data-slot="nav"]) as the whole page —
  // an isolated nav target. MarketingNav is the THIRD interactive component (the narrow view holds an
  // open/closed Radix Dialog drawer), so the hamburger + drawer are exercised as LIVE behaviour (click
  // AND keyboard), not just markup. Because the bar renders BOTH view branches (wide inline links + a
  // narrow hamburger) and hides one with a @container query, every check is scoped to the VISIBLE
  // branch at that width (elements with a layout box) and to the FIRST nav.
  const navBase = `${base}lab.html?surface=nav&lang=it`
  const navPage = await browser.newPage()
  navReport = { overflow: {}, overflowDrawer: null, twoView: null, drawer: null, keyboard: null }

  const measureNavOverflow = () =>
    navPage.evaluate(() => {
      const de = document.documentElement
      const over = de.scrollWidth - de.clientWidth
      let widest = null, max = 0
      for (const el of document.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect()
        if (rect.right - innerWidth > max) { max = rect.right - innerWidth; widest = el.className || el.tagName }
      }
      return { over, widest: max > 1 ? String(widest).slice(0, 60) : null, count: document.querySelectorAll('[data-slot="nav"]').length }
    })
  // click the FIRST nav's hamburger (opens its Radix Dialog drawer)
  const clickHamburger = () =>
    navPage.evaluate(() => {
      const nav = document.querySelector('[data-slot="nav"]')
      const btn = nav && nav.querySelector('[data-slot="nav-hamburger"]')
      if (btn) { btn.click(); return true }
      return false
    })

  // responsive (C11 / rule 1): [data-slot="nav"] must render and the surface must NOT scroll sideways
  // (scrollWidth - clientWidth <= 1) at every width with the bar COLLAPSED. At 320, ALSO open the
  // first drawer and re-measure — the drawer + long labels must not push content off-screen either.
  for (const w of WIDTHS) {
    await navPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await navPage.goto(navBase, { waitUntil: "load" })
    await navPage.waitForSelector('[data-slot="nav"]', { timeout: 15000 })
    const m = await measureNavOverflow()
    navReport.overflow[w] = m.over
    if (!m.count) fail.push(`nav @${w}px: no [data-slot="nav"] rendered`)
    if (m.over > 1) fail.push(`nav @${w}px [closed]: surface scrolls sideways by ${m.over}px (widest: ${m.widest})`)
    if (w === 320) {
      await clickHamburger()
      await navPage.waitForSelector('[data-slot="nav-drawer"]', { timeout: 15000 })
      await sleep(150)
      const d = await measureNavOverflow()
      navReport.overflowDrawer = d.over
      if (d.over > 1) fail.push(`nav @320px [drawer open]: surface scrolls sideways by ${d.over}px (widest: ${d.widest})`)
    }
  }

  // two-view (C8 / rule 2): a resilient visibility probe on the FIRST nav. At 1180 a declared link is
  // INLINE-visible inside [data-slot="nav-links"] AND the hamburger is absent/hidden; at 320 those
  // inline links are HIDDEN (no layout box until the drawer opens) AND the hamburger IS visible. FAIL
  // if identical at both widths (pure reflow) or if the hamburger shows at desktop.
  const twoViewNav = () =>
    navPage.evaluate(() => {
      const vis = (el) => {
        if (!el || el.offsetParent === null || !el.getClientRects().length) return false
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
        return r.height >= 1 && r.width >= 1 && cs.display !== "none" && cs.visibility !== "hidden"
      }
      const nav = document.querySelector('[data-slot="nav"]')
      const linksWrap = nav.querySelector('[data-slot="nav-links"]')
      const firstLink = linksWrap ? linksWrap.querySelector("a") : null
      const ham = nav.querySelector('[data-slot="nav-hamburger"]')
      return { linkVisible: vis(firstLink), hamburgerVisible: vis(ham) }
    })
  await navPage.setViewport({ width: 1180, height: 900, deviceScaleFactor: 1 })
  await navPage.goto(navBase, { waitUntil: "load" })
  await navPage.waitForSelector('[data-slot="nav"]', { timeout: 15000 })
  const nvWide = await twoViewNav()
  await navPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
  await navPage.goto(navBase, { waitUntil: "load" })
  await navPage.waitForSelector('[data-slot="nav"]', { timeout: 15000 })
  const nvNarrow = await twoViewNav()
  navReport.twoView = {
    linkVisible1180: nvWide.linkVisible, hamburger1180: nvWide.hamburgerVisible,
    linkVisible320: nvNarrow.linkVisible, hamburger320: nvNarrow.hamburgerVisible,
  }
  if (!nvWide.linkVisible) fail.push(`nav two-view @1180: an inline link is not visible in [data-slot="nav-links"] (wide view must show the inline links)`)
  if (nvWide.hamburgerVisible) fail.push(`nav two-view @1180: the hamburger is visible at desktop (it must be hidden at wide width)`)
  if (nvNarrow.linkVisible) fail.push(`nav two-view @320: inline links are visible in the bar before the drawer opens (narrow view must hide them behind the hamburger)`)
  if (!nvNarrow.hamburgerVisible) fail.push(`nav two-view @320: the hamburger is not visible (narrow view must show the hamburger)`)
  if (nvWide.linkVisible === nvNarrow.linkVisible) fail.push(`nav two-view: inline link has IDENTICAL visibility at 320 and 1180 — rule 2 wants inline-links-wide vs hamburger-narrow, not one model at both widths`)

  // hamburger opens the drawer (C5): at 320 the drawer is CLOSED by default (no [role="dialog"] /
  // [data-slot="nav-drawer"], hamburger aria-expanded="false"); clicking the hamburger opens a
  // role="dialog" MODAL, aria-expanded flips to true, and the drawer contains EVERY declared link
  // label and BOTH CTA labels as <a href>. The expected labels are read from the first nav's own DOM
  // (its hidden inline links + bar CTAs), so the check tracks the declared copy. Then Escape closes
  // the click-opened drawer (drawer gone).
  //
  // Modality note: this Radix Dialog version enforces the modal contract NOT via a literal
  // aria-modal="true" attribute but by marking every OTHER top-level body child aria-hidden (the nav
  // bars end up under an aria-hidden ancestor while only the drawer's portal stays reachable) plus a
  // focus trap — the stronger "hide the rest" pattern, and axe A/AA agrees. So the gate accepts a
  // modal proven EITHER way: aria-modal="true" OR the bar being inert/aria-hidden while the drawer is
  // not (real modal enforcement), rather than demanding an attribute Radix deliberately omits.
  await navPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
  await navPage.goto(navBase, { waitUntil: "load" })
  await navPage.waitForSelector('[data-slot="nav-hamburger"]', { timeout: 15000 })
  const expectedLabels = await navPage.evaluate(() => {
    const nav = document.querySelector('[data-slot="nav"]')
    const links = [...nav.querySelectorAll('[data-slot="nav-links"] a')].map((a) => (a.textContent || "").trim()).filter(Boolean)
    const ctas = [...nav.querySelectorAll("a")]
      .filter((a) => a.getAttribute("href") !== "/" && !a.closest('[data-slot="nav-links"]'))
      .map((a) => (a.textContent || "").trim()).filter(Boolean)
    return { links, ctas }
  })
  const closedState = await navPage.evaluate(() => {
    const nav = document.querySelector('[data-slot="nav"]')
    const ham = nav.querySelector('[data-slot="nav-hamburger"]')
    return {
      noDialog: !document.querySelector('[role="dialog"]') && !document.querySelector('[data-slot="nav-drawer"]'),
      expanded: ham ? ham.getAttribute("aria-expanded") : null,
    }
  })
  await clickHamburger()
  await navPage.waitForSelector('[data-slot="nav-drawer"]', { timeout: 15000 })
  await sleep(120)
  const openState = await navPage.evaluate((expected) => {
    const drawer = document.querySelector('[data-slot="nav-drawer"]')
    const dialog = document.querySelector('[role="dialog"]')
    const nav = document.querySelector('[data-slot="nav"]')
    const ham = nav.querySelector('[data-slot="nav-hamburger"]')
    const anchors = drawer ? [...drawer.querySelectorAll("a")].map((a) => ({ text: (a.textContent || "").trim(), href: a.getAttribute("href") })) : []
    const has = (label) => anchors.some((a) => a.text === label && typeof a.href === "string" && a.href.length > 0)
    const ariaModal = dialog ? dialog.getAttribute("aria-modal") : null
    // modal enforcement: either the literal attribute, OR the "hide the rest" pattern (the bar is
    // inert/aria-hidden while the drawer's portal is not) that this Radix version uses.
    const bar = document.querySelector('[data-slot="nav"]')
    const barInert = !!(bar && (bar.closest('[aria-hidden="true"]') || bar.closest("[inert]")))
    const drawerReachable = !!(drawer && !drawer.closest('[aria-hidden="true"]') && !drawer.closest("[inert]"))
    const modal = ariaModal === "true" || (barInert && drawerReachable)
    return {
      hasDrawer: !!drawer,
      role: dialog ? dialog.getAttribute("role") : null,
      ariaModal,
      modal,
      mechanism: ariaModal === "true" ? "aria-modal" : barInert && drawerReachable ? "inert-siblings" : "none",
      expanded: ham ? ham.getAttribute("aria-expanded") : null,
      missingLinks: expected.links.filter((l) => !has(l)),
      missingCtas: expected.ctas.filter((c) => !has(c)),
      anchorCount: anchors.length,
    }
  }, expectedLabels)
  await navPage.keyboard.press("Escape")
  await sleep(150)
  const afterEsc = await navPage.evaluate(() => !document.querySelector('[data-slot="nav-drawer"]') && !document.querySelector('[role="dialog"]'))
  navReport.drawer = {
    closedByDefault: closedState.noDialog && closedState.expanded === "false",
    role: openState.role, ariaModal: openState.ariaModal, modal: openState.modal, mechanism: openState.mechanism,
    expandedAfter: openState.expanded,
    links: expectedLabels.links.length, ctas: expectedLabels.ctas.length, anchorCount: openState.anchorCount,
    missingLinks: openState.missingLinks, missingCtas: openState.missingCtas, escCloses: afterEsc,
  }
  if (!closedState.noDialog) fail.push(`nav drawer: a dialog/drawer is present BEFORE the hamburger is used (drawer must be closed by default)`)
  if (closedState.expanded !== "false") fail.push(`nav drawer: hamburger aria-expanded is "${closedState.expanded}" while closed (expected "false")`)
  if (!openState.hasDrawer) fail.push(`nav drawer: clicking the hamburger did not open a [data-slot="nav-drawer"]`)
  if (openState.role !== "dialog") fail.push(`nav drawer: opened drawer role is "${openState.role}" (expected "dialog")`)
  if (!openState.modal) fail.push(`nav drawer: opened drawer is not modal (no aria-modal="true" AND the page behind it is not inert/aria-hidden) — aria-modal="${openState.ariaModal}"`)
  if (openState.expanded !== "true") fail.push(`nav drawer: hamburger aria-expanded did not flip to "true" on open (got "${openState.expanded}")`)
  if (expectedLabels.links.length && openState.missingLinks.length) fail.push(`nav drawer: open drawer is missing declared link label(s) as <a href>: ${openState.missingLinks.join(", ")}`)
  if (expectedLabels.ctas.length < 2) fail.push(`nav drawer: could not read both CTA labels from the bar (found ${expectedLabels.ctas.length}) — the two-view/scoping is off`)
  if (openState.missingCtas.length) fail.push(`nav drawer: open drawer is missing declared CTA label(s) as <a href>: ${openState.missingCtas.join(", ")}`)
  if (!afterEsc) fail.push(`nav drawer: Escape did not close the click-opened drawer (drawer still present)`)

  // keyboard operability + focus-visible + Esc restore (C6/C13): Tab to the FIRST nav's hamburger,
  // assert a visible focus-visible indicator, activate by keyboard (Enter) to open, assert focus moves
  // INTO the dialog (Radix focus trap), press Escape to close, and assert focus is RESTORED to the
  // hamburger (aria-expanded="false" again).
  await navPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
  await navPage.goto(navBase, { waitUntil: "load" })
  await navPage.waitForSelector('[data-slot="nav-hamburger"]', { timeout: 15000 })
  let navKb = null
  for (let i = 0; i < 12 && !navKb; i++) {
    await navPage.keyboard.press("Tab")
    const info = await navPage.evaluate(() => {
      const el = document.activeElement
      if (!el || el.getAttribute("data-slot") !== "nav-hamburger") return { onHamburger: false }
      const cs = getComputedStyle(el)
      let focusVisible = false
      try { focusVisible = el.matches(":focus-visible") } catch {}
      return { onHamburger: true, focusVisible, ring: !!cs.boxShadow && cs.boxShadow !== "none", expanded: el.getAttribute("aria-expanded") }
    })
    if (info.onHamburger) navKb = info
  }
  if (!navKb) {
    fail.push(`nav keyboard: could not Tab to the [data-slot="nav-hamburger"] trigger`)
    navReport.keyboard = { reached: false, focusVisible: false, enterOpens: false, focusInDialog: false, escRestores: false }
  } else {
    const focusOk = navKb.focusVisible || navKb.ring
    if (!focusOk) fail.push(`nav keyboard: focused hamburger has no visible focus-visible indicator (focus-visible:${navKb.focusVisible} boxShadow-ring:${navKb.ring})`)
    await navPage.keyboard.press("Enter")
    await sleep(150)
    const opened = await navPage.evaluate(() => {
      const drawer = document.querySelector('[data-slot="nav-drawer"]')
      const active = document.activeElement
      const focusInDialog = !!(drawer && active && (drawer.contains(active) || (active.closest && active.closest('[role="dialog"]'))))
      const nav = document.querySelector('[data-slot="nav"]')
      const ham = nav.querySelector('[data-slot="nav-hamburger"]')
      return { hasDrawer: !!drawer, focusInDialog, expanded: ham ? ham.getAttribute("aria-expanded") : null }
    })
    if (!opened.hasDrawer) fail.push(`nav keyboard: Enter on the hamburger did not open the drawer`)
    if (opened.expanded !== "true") fail.push(`nav keyboard: Enter did not set aria-expanded="true" (got "${opened.expanded}")`)
    if (!opened.focusInDialog) fail.push(`nav keyboard: focus did not move into the dialog on open (Radix focus trap)`)
    await navPage.keyboard.press("Escape")
    await sleep(150)
    const restored = await navPage.evaluate(() => {
      const nav = document.querySelector('[data-slot="nav"]')
      const ham = nav.querySelector('[data-slot="nav-hamburger"]')
      const active = document.activeElement
      return {
        closed: !document.querySelector('[data-slot="nav-drawer"]'),
        focusRestored: active === ham,
        expanded: ham ? ham.getAttribute("aria-expanded") : null,
      }
    })
    if (!restored.closed) fail.push(`nav keyboard: Escape did not close the drawer`)
    if (!restored.focusRestored) fail.push(`nav keyboard: focus was not restored to the hamburger on close`)
    if (restored.expanded !== "false") fail.push(`nav keyboard: hamburger aria-expanded did not return to "false" after Escape (got "${restored.expanded}")`)
    navReport.keyboard = { reached: true, focusVisible: focusOk, enterOpens: opened.hasDrawer, focusInDialog: opened.focusInDialog, escRestores: restored.focusRestored && restored.closed }
  }

  // axe A/AA (C13), both themes × (desktop bar CLOSED, narrow drawer OPEN): zero serious/critical in
  // every combination, including contrast over the sticky surface and inside the open drawer. Theme
  // via localStorage("astrochat.mode"), the same mechanism the other passes use.
  navAxe = {}
  const runNavAxe = () =>
    navPage.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }))
  const collectNav = (res, label) => {
    const serious = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    for (const v of serious) {
      fail.push(`nav a11y [${label}] ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length}×, e.g. ${(v.nodes[0]?.target || []).join(" ")})`)
    }
    return serious.length
  }
  for (const mode of ["dark", "light"]) {
    await navPage.evaluateOnNewDocument((m) => { try { localStorage.setItem("astrochat.mode", m) } catch {} }, mode)
    // desktop bar, closed
    await navPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await navPage.goto(navBase, { waitUntil: "load" })
    await navPage.waitForSelector('[data-slot="nav"]', { timeout: 15000 })
    await navPage.addScriptTag({ content: axeSrc })
    const barCount = collectNav(await runNavAxe(), `${mode}/bar`)
    // narrow, drawer open
    await navPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
    await navPage.goto(navBase, { waitUntil: "load" })
    await navPage.waitForSelector('[data-slot="nav-hamburger"]', { timeout: 15000 })
    await clickHamburger()
    await navPage.waitForSelector('[data-slot="nav-drawer"]', { timeout: 15000 })
    await sleep(150)
    await navPage.addScriptTag({ content: axeSrc })
    const drawerCount = collectNav(await runNavAxe(), `${mode}/drawer-open`)
    navAxe[mode] = { bar: barCount, drawer: drawerCount }
  }
  await navPage.close()

  // ── FOOTER SURFACE (phase 39 t5) — an EIGHTH, additive pass on lab.html?surface=footer ──
  // Additive: the index.html app checks AND the Hero + Features + Pricing + FAQ + CTA + Nav surface
  // passes above are untouched, so phase-32..38 coverage does not regress. Runs on its OWN tab. The
  // surface renders the three product Footers (each [data-slot="footer"]) as the whole page — an
  // isolated footer target. Footer is the FOURTH interactive component (the narrow view holds an
  // independent open/closed accordion state PER column, type="multiple"), so its columns are
  // exercised as LIVE behaviour (click + keyboard), not just markup. Because the footer renders BOTH
  // view branches (narrow collapsible accordion columns + wide always-open multi-column grid) and
  // hides one with a @container query, every check is scoped to the VISIBLE branch at that width
  // (elements with a layout box: offsetParent !== null / non-empty getClientRects) and to the FIRST
  // footer, so the display:none branch is ignored.
  const footerBase = `${base}lab.html?surface=footer&lang=it`
  const footerPage = await browser.newPage()
  footerReport = { overflow: {}, overflowExpanded: {}, twoView: null, keyboard: null }

  // helpers on the footer page
  const measureFooterOverflow = () =>
    footerPage.evaluate(() => {
      const de = document.documentElement
      const over = de.scrollWidth - de.clientWidth
      let widest = null, max = 0
      for (const el of document.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect()
        if (rect.right - innerWidth > max) { max = rect.right - innerWidth; widest = el.className || el.tagName }
      }
      return { over, widest: max > 1 ? String(widest).slice(0, 60) : null, count: document.querySelectorAll('[data-slot="footer"]').length }
    })
  // expand the FIRST visible (narrow-branch) column heading inside EVERY footer section, revealing its
  // links group (so overflow / axe see a wide-open expanded state, not just collapsed). At the wide
  // widths there are no visible narrow-branch heading buttons, so this clicks nothing.
  const expandFirstFooterEach = () =>
    footerPage.$$eval('[data-slot="footer"]', (sections) => {
      let n = 0
      for (const s of sections) {
        const hs = [...s.querySelectorAll('button[data-slot="footer-col-heading"]')].filter((el) => el.offsetParent !== null && el.getClientRects().length)
        if (hs[0]) { hs[0].click(); n++ }
      }
      return n
    })
  // click the Nth narrow-branch column heading of the FIRST footer section
  const clickFooterHeading = (n) =>
    footerPage.evaluate((n) => {
      const s = document.querySelector('[data-slot="footer"]')
      const narrow = [...s.querySelectorAll('[data-slot="footer-col"]')].filter((c) => c.querySelector('button[data-slot="footer-col-heading"]'))
      const btn = narrow[n] && narrow[n].querySelector('button[data-slot="footer-col-heading"]')
      if (btn) { btn.click(); return true }
      return false
    }, n)
  // read the Nth narrow-branch column's links group (visible?) of the FIRST footer section
  const readFooterLinks = (n) =>
    footerPage.evaluate((n) => {
      const vis = (el) => {
        if (!el || el.offsetParent === null || !el.getClientRects().length) return false
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
        return r.height >= 1 && r.width >= 1 && cs.display !== "none" && cs.visibility !== "hidden"
      }
      const s = document.querySelector('[data-slot="footer"]')
      const narrow = [...s.querySelectorAll('[data-slot="footer-col"]')].filter((c) => c.querySelector('button[data-slot="footer-col-heading"]'))
      const c = narrow[n]
      const links = c ? c.querySelector('[data-slot="footer-col-links"]') : null
      const firstLink = links ? links.querySelector("a") : null
      return { visible: vis(links) || vis(firstLink) }
    }, n)

  // ── responsive (C7 / rule 1), collapsed AND expanded: at every width the surface must NOT scroll
  // sideways (scrollWidth - clientWidth <= 1) with all columns collapsed; then on the NARROW widths
  // (320, 768) expand each section's first column and re-measure — long labels must not push content
  // off-screen while a column is open. ──
  for (const w of WIDTHS) {
    await footerPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await footerPage.goto(footerBase, { waitUntil: "load" })
    await footerPage.waitForSelector('[data-slot="footer"]', { timeout: 15000 })
    const m = await measureFooterOverflow()
    footerReport.overflow[w] = m.over
    if (!m.count) fail.push(`footer @${w}px: no [data-slot="footer"] rendered`)
    if (m.over > 1) fail.push(`footer @${w}px [collapsed]: surface scrolls sideways by ${m.over}px (widest: ${m.widest})`)
    if (w === 320 || w === 768) {
      await expandFirstFooterEach()
      await sleep(150)
      const e = await measureFooterOverflow()
      footerReport.overflowExpanded[w] = e.over
      if (e.over > 1) fail.push(`footer @${w}px [expanded]: surface scrolls sideways by ${e.over}px (widest: ${e.widest})`)
    }
  }

  // ── two-view visibility (C5/C6 / rule 2): a resilient visibility probe on the FIRST footer. At 320
  // the first column's [data-slot="footer-col-links"] is HIDDEN before interaction (collapsed
  // accordion, no layout box) and the visible columns are a SINGLE column; activating its
  // [data-slot="footer-col-heading"] button REVEALS its links. At 1180 every column's links are
  // VISIBLE with NO interaction and the columns are a MULTI-column arrangement (>= 2 share a row).
  // FAIL if the load visibility is identical at both widths (collapsible-at-both / always-open-at-both)
  // or the wide view is not multi-column. ──
  const footerTwoViewProbe = () =>
    footerPage.evaluate(() => {
      const vis = (el) => {
        if (!el || el.offsetParent === null || !el.getClientRects().length) return false
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
        return r.height >= 1 && r.width >= 1 && cs.display !== "none" && cs.visibility !== "hidden"
      }
      const s = document.querySelector('[data-slot="footer"]')
      const cols = [...s.querySelectorAll('[data-slot="footer-col"]')].filter((c) => c.offsetParent !== null && c.getClientRects().length)
      const first = cols[0]
      const links = first ? first.querySelector('[data-slot="footer-col-links"]') : null
      const firstLink = links ? links.querySelector("a") : null
      const rects = cols.map((c) => c.getBoundingClientRect())
      let sameRow = false
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j]
        if (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4) sameRow = true
      }
      return { linksVisible: vis(links) || vis(firstLink), cols: sameRow ? 2 : 1, items: cols.length }
    })
  await footerPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
  await footerPage.goto(footerBase, { waitUntil: "load" })
  await footerPage.waitForSelector('[data-slot="footer-col"]', { timeout: 15000 })
  const ftv320 = await footerTwoViewProbe()
  await clickFooterHeading(0)
  await sleep(150)
  const ftv320Revealed = (await readFooterLinks(0)).visible
  await footerPage.setViewport({ width: 1180, height: 900, deviceScaleFactor: 1 })
  await footerPage.goto(footerBase, { waitUntil: "load" })
  await footerPage.waitForSelector('[data-slot="footer-col"]', { timeout: 15000 })
  const ftv1180 = await footerTwoViewProbe()
  footerReport.twoView = {
    hidden320: !ftv320.linksVisible, revealed320: ftv320Revealed, cols320: ftv320.cols,
    visible1180: ftv1180.linksVisible, cols1180: ftv1180.cols,
  }
  if (ftv320.linksVisible) fail.push(`footer two-view @320: first column's links are visible BEFORE interaction (narrow view must collapse links until a heading is activated)`)
  if (!ftv320Revealed) fail.push(`footer two-view @320: first column's links did not become visible after activating its heading`)
  if (ftv320.cols !== 1) fail.push(`footer two-view @320: columns are not a single column (detected ${ftv320.cols} columns)`)
  if (!ftv1180.linksVisible) fail.push(`footer two-view @1180: first column's links are not visible without interaction (wide view must be always-open)`)
  if (ftv1180.cols < 2) fail.push(`footer two-view @1180: wide view is not multi-column always-open (detected ${ftv1180.cols} column)`)
  if (ftv320.linksVisible === ftv1180.linksVisible) fail.push(`footer two-view: first column's links have IDENTICAL load visibility at 320 and 1180 — rule 2 wants collapsible-narrow vs always-open-wide, not one model at both widths`)

  // ── keyboard operability + focus-visible (C5/C12): at 320, Tab to a [data-slot="footer-col-heading"]
  // <button> trigger, assert a visible focus-visible indicator (`:focus-visible` match or a non-none
  // boxShadow ring), then Enter opens (aria-expanded true) and Space toggles it closed (aria-expanded
  // false) the same way a click does. Mirrors the FAQ keyboard probe. ──
  await footerPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
  await footerPage.goto(footerBase, { waitUntil: "load" })
  await footerPage.waitForSelector('button[data-slot="footer-col-heading"]', { timeout: 15000 })
  let footerKb = null
  for (let i = 0; i < 12 && !footerKb; i++) {
    await footerPage.keyboard.press("Tab")
    const info = await footerPage.evaluate(() => {
      const el = document.activeElement
      if (!el || el.getAttribute("data-slot") !== "footer-col-heading" || el.tagName !== "BUTTON") return { onTrigger: false }
      const cs = getComputedStyle(el)
      let focusVisible = false
      try { focusVisible = el.matches(":focus-visible") } catch {}
      return { onTrigger: true, focusVisible, ring: !!cs.boxShadow && cs.boxShadow !== "none", expanded: el.getAttribute("aria-expanded") }
    })
    if (info.onTrigger) footerKb = info
  }
  if (!footerKb) {
    fail.push(`footer keyboard: could not Tab to a [data-slot="footer-col-heading"] trigger`)
    footerReport.keyboard = { reached: false, focusVisible: false, enterToggles: false, spaceToggles: false }
  } else {
    const focusOk = footerKb.focusVisible || footerKb.ring
    if (!focusOk) fail.push(`footer keyboard: focused heading has no visible focus-visible indicator (focus-visible:${footerKb.focusVisible} boxShadow-ring:${footerKb.ring})`)
    const readExpanded = () => footerPage.evaluate(() => { const el = document.activeElement; return el ? el.getAttribute("aria-expanded") : null })
    const before = await readExpanded()
    await footerPage.keyboard.press("Enter")
    await sleep(150)
    const afterEnter = await readExpanded()
    await footerPage.keyboard.press(" ")
    await sleep(150)
    const afterSpace = await readExpanded()
    const enterToggles = before === "false" && afterEnter === "true"
    const spaceToggles = afterEnter === "true" && afterSpace === "false"
    if (!enterToggles) fail.push(`footer keyboard: Enter did not toggle aria-expanded open (before ${before} after ${afterEnter})`)
    if (!spaceToggles) fail.push(`footer keyboard: Space did not toggle aria-expanded closed (afterEnter ${afterEnter} afterSpace ${afterSpace})`)
    footerReport.keyboard = { reached: true, focusVisible: focusOk, enterToggles, spaceToggles }
  }

  // ── axe A/AA (C12), both themes × (narrow collapsed, narrow with a column expanded, wide grid):
  // zero serious/critical in every combination, including text + non-text contrast. Theme via
  // localStorage("astrochat.mode"), the same mechanism the other passes use. ──
  footerAxe = {}
  const runFooterAxe = () =>
    footerPage.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }))
  const collectFooter = (res, label) => {
    const serious = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    for (const v of serious) {
      fail.push(`footer a11y [${label}] ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length}×, e.g. ${(v.nodes[0]?.target || []).join(" ")})`)
    }
    return serious.length
  }
  for (const mode of ["dark", "light"]) {
    await footerPage.evaluateOnNewDocument((m) => { try { localStorage.setItem("astrochat.mode", m) } catch {} }, mode)
    // narrow, collapsed
    await footerPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
    await footerPage.goto(footerBase, { waitUntil: "load" })
    await footerPage.waitForSelector('[data-slot="footer"]', { timeout: 15000 })
    await footerPage.addScriptTag({ content: axeSrc })
    const collapsed = collectFooter(await runFooterAxe(), `${mode}/narrow-collapsed`)
    // narrow, with a column expanded
    await expandFirstFooterEach()
    await sleep(150)
    const expanded = collectFooter(await runFooterAxe(), `${mode}/narrow-expanded`)
    // wide, always-open grid
    await footerPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await footerPage.goto(footerBase, { waitUntil: "load" })
    await footerPage.waitForSelector('[data-slot="footer"]', { timeout: 15000 })
    await footerPage.addScriptTag({ content: axeSrc })
    const wide = collectFooter(await runFooterAxe(), `${mode}/wide`)
    footerAxe[mode] = { collapsed, expanded, wide }
  }
  await footerPage.close()

  // ── TESTIMONIALS SURFACE (phase 40 t5) — a NINTH, additive pass on lab.html?surface=testimonials ──
  // Additive: the index.html app checks AND the Hero + Features + Pricing + FAQ + CTA + Nav + Footer
  // surface passes above are untouched, so phase-32..39 coverage does not regress. Runs on its OWN
  // tab. The surface renders the three product Testimonials (each [data-slot="testimonials"]) as the
  // whole page — an isolated Testimonials target. Testimonials is a NON-interactive social-proof
  // block whose narrow view is a native horizontal scroll-snap CAROUSEL (no JS state, no autoplay).
  // The load-bearing check: the carousel scrolls INTERNALLY (overflow-x on the track only), so the
  // PAGE never scrolls sideways. Every structural check is scoped to the FIRST
  // [data-slot="testimonials"] and its FIRST [data-slot="testimonial-track"].
  const testimonialsBase = `${base}lab.html?surface=testimonials&lang=it`
  const testimonialsPage = await browser.newPage()
  testimonialsReport = { overflow: {}, internalScroll: null, twoView: null, reach: null, semantics: null }

  const measureTestimonialsOverflow = () =>
    testimonialsPage.evaluate(() => {
      const de = document.documentElement
      const over = de.scrollWidth - de.clientWidth
      let widest = null, max = 0
      for (const el of document.querySelectorAll("*")) {
        const rect = el.getBoundingClientRect()
        if (rect.right - innerWidth > max) { max = rect.right - innerWidth; widest = el.className || el.tagName }
      }
      return { over, widest: max > 1 ? String(widest).slice(0, 60) : null, count: document.querySelectorAll('[data-slot="testimonials"]').length }
    })

  // ── responsive (C8 / rule 1): [data-slot="testimonials"] must render and the PAGE must NOT scroll
  // sideways (documentElement.scrollWidth - clientWidth <= 1) at every width, with the long-copy /
  // many-item declarations present. This is the load-bearing check: a carousel that pushed the page
  // sideways (overflow-x on the section/page rather than the track) would fail here. ──
  for (const w of WIDTHS) {
    await testimonialsPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await testimonialsPage.goto(testimonialsBase, { waitUntil: "load" })
    await testimonialsPage.waitForSelector('[data-slot="testimonials"]', { timeout: 15000 })
    const m = await measureTestimonialsOverflow()
    testimonialsReport.overflow[w] = m.over
    if (!m.count) fail.push(`testimonials @${w}px: no [data-slot="testimonials"] rendered`)
    if (m.over > 1) fail.push(`testimonials @${w}px: PAGE scrolls sideways by ${m.over}px (widest: ${m.widest}) — the carousel must scroll INTERNALLY, not push the page`)
  }

  // ── internal-scroll confinement (C8): at 320 the FIRST [data-slot="testimonial-track"] scrolls
  // INTERNALLY (track.scrollWidth > track.clientWidth) while document.body / documentElement stay
  // within their client width — the overflow-x is confined to the track, never the page. ──
  await testimonialsPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
  await testimonialsPage.goto(testimonialsBase, { waitUntil: "load" })
  await testimonialsPage.waitForSelector('[data-slot="testimonial-track"]', { timeout: 15000 })
  const internal = await testimonialsPage.evaluate(() => {
    const s = document.querySelector('[data-slot="testimonials"]')
    const track = s.querySelector('[data-slot="testimonial-track"]')
    const de = document.documentElement, body = document.body
    return {
      trackScrolls: track.scrollWidth > track.clientWidth + 1,
      trackOver: track.scrollWidth - track.clientWidth,
      pageOver: de.scrollWidth - de.clientWidth,
      bodyOver: body.scrollWidth - body.clientWidth,
    }
  })
  testimonialsReport.internalScroll = internal
  if (!internal.trackScrolls) fail.push(`testimonials @320: the carousel track does NOT scroll internally (track.scrollWidth-clientWidth ${internal.trackOver}) — the narrow view must be a horizontal scroller`)
  if (internal.pageOver > 1) fail.push(`testimonials @320: the PAGE scrolls sideways by ${internal.pageOver}px — overflow-x must be confined to the track`)
  if (internal.bodyOver > 1) fail.push(`testimonials @320: document.body scrolls sideways by ${internal.bodyOver}px — overflow-x must be confined to the track`)

  // ── two-view (C9 / rule 2): capture the FIRST track + its cards at 320 vs 1180. At 1180 the track
  // is a multi-column GRID: EVERY [data-slot="testimonial"] is visible, >= 2 share a horizontal band
  // (same row), and the track is NOT a horizontal scroller (track.scrollWidth - clientWidth <= 1). At
  // 320 the cards are a SINGLE horizontally-scrollable snap row: the track scrolls
  // (track.scrollWidth > track.clientWidth) with the cards laid out in one row. FAIL if identical at
  // both widths (grids at both / scrolls at both). ──
  const testimonialsView = async (w) => {
    await testimonialsPage.setViewport({ width: w, height: 900, deviceScaleFactor: 1 })
    await testimonialsPage.goto(testimonialsBase, { waitUntil: "load" })
    await testimonialsPage.waitForSelector('[data-slot="testimonial"]', { timeout: 15000 })
    return await testimonialsPage.evaluate(() => {
      const vis = (el) => {
        if (!el || el.offsetParent === null || !el.getClientRects().length) return false
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
        return r.height >= 1 && r.width >= 1 && cs.display !== "none" && cs.visibility !== "hidden"
      }
      const s = document.querySelector('[data-slot="testimonials"]')
      const track = s.querySelector('[data-slot="testimonial-track"]')
      const cards = [...s.querySelectorAll('[data-slot="testimonial"]')]
      const rects = cards.map((c) => c.getBoundingClientRect())
      let sameRow = false
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j]
        if (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4) sameRow = true
      }
      return {
        cards: cards.length,
        sameRow,
        scrolls: track.scrollWidth > track.clientWidth + 1,
        trackOver: track.scrollWidth - track.clientWidth,
        allVisible: cards.length > 0 && cards.every((c) => vis(c)),
      }
    })
  }
  const ttv1180 = await testimonialsView(1180)
  const ttv320 = await testimonialsView(320)
  testimonialsReport.twoView = {
    grid1180: { cards: ttv1180.cards, allVisible: ttv1180.allVisible, sameRow: ttv1180.sameRow, scrolls: ttv1180.scrolls },
    carousel320: { cards: ttv320.cards, sameRow: ttv320.sameRow, scrolls: ttv320.scrolls },
  }
  if (!ttv1180.allVisible) fail.push(`testimonials two-view @1180: not every [data-slot="testimonial"] card is visible (wide view must show all cards)`)
  if (!ttv1180.sameRow) fail.push(`testimonials two-view @1180: no two cards share a horizontal band (wide view must be a multi-column grid)`)
  if (ttv1180.scrolls) fail.push(`testimonials two-view @1180: the track is a horizontal scroller (track.scrollWidth-clientWidth ${ttv1180.trackOver}) — the wide grid must not overflow-scroll`)
  if (!ttv320.scrolls) fail.push(`testimonials two-view @320: the track is NOT a horizontal scroller (track.scrollWidth-clientWidth ${ttv320.trackOver}) — the narrow view must be a scroll-snap carousel`)
  if (!ttv320.sameRow) fail.push(`testimonials two-view @320: the cards are not laid out in a single row (narrow carousel must be one scrollable row)`)
  if (ttv1180.scrolls === ttv320.scrolls) fail.push(`testimonials two-view: the track has IDENTICAL scroll behaviour at 320 and 1180 (scrolls:${ttv320.scrolls}) — rule 2 wants a narrow scroll-snap carousel vs a wide non-scrolling grid, not one model at both widths`)

  // ── carousel scroll reachability (C16): at 320 set the FIRST track's scrollLeft to its max offset
  // and assert a card beyond the first becomes reachable / in-view — proving the carousel actually
  // scrolls in the mobile preview (a card off the first screen is reached by scrolling). ──
  await testimonialsPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
  await testimonialsPage.goto(testimonialsBase, { waitUntil: "load" })
  await testimonialsPage.waitForSelector('[data-slot="testimonial-track"]', { timeout: 15000 })
  const reach = await testimonialsPage.evaluate(() => {
    const s = document.querySelector('[data-slot="testimonials"]')
    const track = s.querySelector('[data-slot="testimonial-track"]')
    const cards = [...s.querySelectorAll('[data-slot="testimonial"]')]
    const last = cards[cards.length - 1]
    const inView = (el) => {
      const r = el.getBoundingClientRect(), t = track.getBoundingClientRect()
      return r.left < t.right - 4 && r.right > t.left + 4 // horizontally within the track viewport
    }
    const maxScroll = track.scrollWidth - track.clientWidth
    const beforeInView = last ? inView(last) : false
    track.scrollLeft = maxScroll
    const afterLeft = track.scrollLeft
    return { cards: cards.length, maxScroll, afterLeft, scrolled: afterLeft > 1, beforeInView, afterInView: last ? inView(last) : false }
  })
  testimonialsReport.reach = reach
  if (reach.cards < 2) fail.push(`testimonials reach @320: fewer than 2 cards in the first section (${reach.cards}) — cannot prove a beyond-first card`)
  if (reach.maxScroll <= 1) fail.push(`testimonials reach @320: the track has nothing to scroll (maxScroll ${reach.maxScroll}) — the carousel is not overflowing`)
  if (!reach.scrolled) fail.push(`testimonials reach @320: setting scrollLeft did not move the track (stayed ${reach.afterLeft}) — the carousel is not scrollable`)
  if (!reach.afterInView) fail.push(`testimonials reach @320: the last card is not reachable by scrolling the track (a card beyond the first stays off-screen)`)

  // ── rating label + avatar presence (C6/C5, optional): confirm a [data-slot="testimonial-rating"]
  // carries a non-empty accessible name (aria-label) and that an avatar <img> OR an initials fallback
  // is present in the first section. ──
  await testimonialsPage.setViewport({ width: 1180, height: 900, deviceScaleFactor: 1 })
  await testimonialsPage.goto(testimonialsBase, { waitUntil: "load" })
  await testimonialsPage.waitForSelector('[data-slot="testimonials"]', { timeout: 15000 })
  const semantics = await testimonialsPage.evaluate(() => {
    const s = document.querySelector('[data-slot="testimonials"]')
    const rating = s.querySelector('[data-slot="testimonial-rating"]')
    const label = rating ? (rating.getAttribute("aria-label") || "").trim() : null
    const hasImg = !!s.querySelector('[data-slot="testimonial"] img')
    const hasInitials = [...s.querySelectorAll('[data-slot="testimonial"] span[aria-hidden="true"]')]
      .some((el) => /^[A-Z]{1,3}$/.test((el.textContent || "").trim()))
    return { hasRating: !!rating, label, hasImg, hasInitials }
  })
  testimonialsReport.semantics = semantics
  if (semantics.hasRating && !semantics.label) fail.push(`testimonials rating: [data-slot="testimonial-rating"] has no accessible name (empty aria-label)`)
  if (!semantics.hasImg && !semantics.hasInitials) fail.push(`testimonials avatar: neither an avatar <img> nor an initials fallback is present in the first section`)

  // ── axe A/AA (C13), both themes × (wide grid @1440, narrow carousel @320): zero serious/critical,
  // including text + non-text contrast on the quote, author name/role, initials fallback, and rating
  // stars. Theme via localStorage("astrochat.mode"), the same mechanism the other passes use. ──
  testimonialsAxe = {}
  const runTestimonialsAxe = () =>
    testimonialsPage.evaluate(async () => await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }))
  const collectTestimonials = (res, label) => {
    const serious = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    for (const v of serious) {
      fail.push(`testimonials a11y [${label}] ${v.impact}: ${v.id} — ${v.help} (${v.nodes.length}×, e.g. ${(v.nodes[0]?.target || []).join(" ")})`)
    }
    return serious.length
  }
  for (const mode of ["dark", "light"]) {
    await testimonialsPage.evaluateOnNewDocument((m) => { try { localStorage.setItem("astrochat.mode", m) } catch {} }, mode)
    // wide grid @1440
    await testimonialsPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
    await testimonialsPage.goto(testimonialsBase, { waitUntil: "load" })
    await testimonialsPage.waitForSelector('[data-slot="testimonials"]', { timeout: 15000 })
    await testimonialsPage.addScriptTag({ content: axeSrc })
    const grid = collectTestimonials(await runTestimonialsAxe(), `${mode}/grid`)
    // narrow carousel @320
    await testimonialsPage.setViewport({ width: 320, height: 900, deviceScaleFactor: 1 })
    await testimonialsPage.goto(testimonialsBase, { waitUntil: "load" })
    await testimonialsPage.waitForSelector('[data-slot="testimonials"]', { timeout: 15000 })
    await testimonialsPage.addScriptTag({ content: axeSrc })
    const carousel = collectTestimonials(await runTestimonialsAxe(), `${mode}/carousel`)
    testimonialsAxe[mode] = { grid, carousel }
  }
  await testimonialsPage.close()
} finally {
  if (browser) await browser.close()
  server.close()
}

console.log("\n  astro-ui · RESPONSIVE + A11Y GATE\n")
if (heroReport) {
  console.log("  Hero surface (lab.html?surface=hero):")
  console.log(`    overflow scrollWidth-clientWidth: ${WIDTHS.map((w) => `${w}px→${heroReport.overflow[w]}`).join("  ")}`)
  if (heroReport.structure) {
    const { s320, s1180 } = heroReport.structure
    console.log(`    structural 320 {order:${s320.order} geom:${s320.geom}} vs 1180 {order:${s1180.order} geom:${s1180.geom}} → ${s320.geom === s1180.geom && s320.order === s1180.order ? "IDENTICAL (fail)" : "different (ok)"}`)
  }
  if (heroAxe) console.log(`    axe serious/critical: dark ${heroAxe.dark}, light ${heroAxe.light}`)
  console.log("")
}
if (featuresReport) {
  console.log("  FeatureGrid surface (lab.html?surface=features):")
  console.log(`    overflow scrollWidth-clientWidth: ${WIDTHS.map((w) => `${w}px→${featuresReport.overflow[w]}`).join("  ")}`)
  if (featuresReport.structure) {
    const { f320, f1180 } = featuresReport.structure
    console.log(`    structural icon↔title 320 {rel:${f320.rel}} vs 1180 {rel:${f1180.rel}} → ${f320.rel === f1180.rel ? "IDENTICAL (fail)" : "different (ok)"}`)
  }
  if (featuresAxe) console.log(`    axe serious/critical: dark ${featuresAxe.dark}, light ${featuresAxe.light}`)
  console.log("")
}
if (pricingReport) {
  console.log("  Pricing surface (lab.html?surface=pricing):")
  console.log(`    overflow [monthly] scrollWidth-clientWidth: ${WIDTHS.map((w) => `${w}px→${pricingReport.overflow[w]}`).join("  ")}`)
  console.log(`    overflow [annual]  scrollWidth-clientWidth: ${WIDTHS.map((w) => `${w}px→${pricingReport.overflowAnnual[w]}`).join("  ")}`)
  if (pricingReport.priceSwitch) {
    const p = pricingReport.priceSwitch
    console.log(`    billing toggle: ${p.count} price(s), e.g. ${p.example} → ${p.ok ? "all switch + revert (ok)" : "FAILED"}`)
  }
  if (pricingReport.keyboard) {
    const k = pricingReport.keyboard
    console.log(`    keyboard: reached annual option ${k.reached}, focus-visible ${k.focusVisible}, Enter flips price ${k.flips}`)
  }
  if (pricingReport.reorder) {
    const r = pricingReport.reorder
    console.log(`    highlighted reorder: 320 index ${r.i320} (first) vs 1180 index ${r.i1180} (center), lifted ${r.lifted} → ${r.i320 !== r.i1180 ? "different (ok)" : "IDENTICAL (fail)"}`)
  }
  if (pricingAxe) console.log(`    axe serious/critical: dark {monthly ${pricingAxe.dark?.monthly}, annual ${pricingAxe.dark?.annual}}, light {monthly ${pricingAxe.light?.monthly}, annual ${pricingAxe.light?.annual}}`)
  console.log("")
}
if (faqReport) {
  console.log("  FAQ surface (lab.html?surface=faq):")
  console.log(`    overflow [collapsed] scrollWidth-clientWidth: ${WIDTHS.map((w) => `${w}px→${faqReport.overflow[w]}`).join("  ")}`)
  console.log(`    overflow [expanded]  scrollWidth-clientWidth: ${[320, 768].map((w) => `${w}px→${faqReport.overflowExpanded[w]}`).join("  ")}`)
  if (faqReport.twoView) {
    const t = faqReport.twoView
    console.log(`    two-view: 320 {answer hidden ${t.hidden320}, reveals on click ${t.revealed320}, cols ${t.cols320}} vs 1180 {answer visible ${t.visible1180}, cols ${t.cols1180}} → ${t.hidden320 && t.visible1180 && t.cols320 === 1 && t.cols1180 >= 2 ? "different (ok)" : "FAILED"}`)
  }
  if (faqReport.singleOpen) {
    const s = faqReport.singleOpen
    console.log(`    single-open: item1 opens ${s.open0}, opening item2 closes item1 ${s.closed0AfterOpen1}, item2 open ${s.open1}, item2 re-collapses ${s.collapsed1}, declared copy ${s.textOk}`)
  }
  if (faqReport.keyboard) {
    const k = faqReport.keyboard
    console.log(`    keyboard: reached trigger ${k.reached}, focus-visible ${k.focusVisible}, Enter opens ${k.enterToggles}, Space closes ${k.spaceToggles}`)
  }
  if (faqAxe) console.log(`    axe serious/critical: dark {collapsed ${faqAxe.dark?.collapsed}, expanded ${faqAxe.dark?.expanded}, wide ${faqAxe.dark?.wide}}, light {collapsed ${faqAxe.light?.collapsed}, expanded ${faqAxe.light?.expanded}, wide ${faqAxe.light?.wide}}`)
  console.log("")
}
if (ctaReport) {
  console.log("  CTASection surface (lab.html?surface=cta):")
  console.log(`    overflow scrollWidth-clientWidth: ${WIDTHS.map((w) => `${w}px→${ctaReport.overflow[w]}`).join("  ")}`)
  if (ctaReport.recolor) {
    const r = ctaReport.recolor
    console.log(`    accent recolor: band bg ${r.bandBg} (${r.bandRecolors ? "recolors" : "STATIC"}), primaryCta text ${r.primaryText} (${r.primaryRecolors ? "recolors" : "STATIC"})`)
  }
  if (ctaReport.structure) {
    const { c320, c1180 } = ctaReport.structure
    console.log(`    structural text↔actions 320 {rel:${c320.rel} centered:${c320.centered} actionsFrac:${c320.actionsFrac}} vs 1180 {rel:${c1180.rel}} → ${c320.rel === c1180.rel ? "IDENTICAL (fail)" : "different (ok)"}`)
  }
  if (ctaReport.keyboard) {
    const k = ctaReport.keyboard
    console.log(`    keyboard: reached ${k.reached} CTA anchor(s), focus-visible ${k.focusVisible}, carries href ${k.hasHref}`)
  }
  if (ctaAxe) console.log(`    axe serious/critical: dark ${ctaAxe.dark}, light ${ctaAxe.light}`)
  console.log("")
}
if (navReport) {
  console.log("  MarketingNav surface (lab.html?surface=nav):")
  console.log(`    overflow [closed] scrollWidth-clientWidth: ${WIDTHS.map((w) => `${w}px→${navReport.overflow[w]}`).join("  ")}`)
  console.log(`    overflow [drawer open @320]: ${navReport.overflowDrawer}`)
  if (navReport.twoView) {
    const t = navReport.twoView
    console.log(`    two-view: 1180 {link inline ${t.linkVisible1180}, hamburger ${t.hamburger1180}} vs 320 {link inline ${t.linkVisible320}, hamburger ${t.hamburger320}} → ${t.linkVisible1180 && !t.hamburger1180 && !t.linkVisible320 && t.hamburger320 ? "different (ok)" : "FAILED"}`)
  }
  if (navReport.drawer) {
    const d = navReport.drawer
    console.log(`    drawer: closed by default ${d.closedByDefault}, opens role=${d.role} modal=${d.modal} (via ${d.mechanism}) aria-expanded→${d.expandedAfter}, ${d.links} link(s)+${d.ctas} CTA(s) present (missing links [${d.missingLinks.join(",")}] CTAs [${d.missingCtas.join(",")}]), Esc closes ${d.escCloses}`)
  }
  if (navReport.keyboard) {
    const k = navReport.keyboard
    console.log(`    keyboard: reached hamburger ${k.reached}, focus-visible ${k.focusVisible}, Enter opens ${k.enterOpens}, focus into dialog ${k.focusInDialog}, Esc closes+restores ${k.escRestores}`)
  }
  if (navAxe) console.log(`    axe serious/critical: dark {bar ${navAxe.dark?.bar}, drawer ${navAxe.dark?.drawer}}, light {bar ${navAxe.light?.bar}, drawer ${navAxe.light?.drawer}}`)
  console.log("")
}
if (footerReport) {
  console.log("  Footer surface (lab.html?surface=footer):")
  console.log(`    overflow [collapsed] scrollWidth-clientWidth: ${WIDTHS.map((w) => `${w}px→${footerReport.overflow[w]}`).join("  ")}`)
  console.log(`    overflow [expanded]  scrollWidth-clientWidth: ${[320, 768].map((w) => `${w}px→${footerReport.overflowExpanded[w]}`).join("  ")}`)
  if (footerReport.twoView) {
    const t = footerReport.twoView
    console.log(`    two-view: 320 {links hidden ${t.hidden320}, reveals on click ${t.revealed320}, cols ${t.cols320}} vs 1180 {links visible ${t.visible1180}, cols ${t.cols1180}} → ${t.hidden320 && t.visible1180 && t.cols320 === 1 && t.cols1180 >= 2 ? "different (ok)" : "FAILED"}`)
  }
  if (footerReport.keyboard) {
    const k = footerReport.keyboard
    console.log(`    keyboard: reached heading ${k.reached}, focus-visible ${k.focusVisible}, Enter opens ${k.enterToggles}, Space closes ${k.spaceToggles}`)
  }
  if (footerAxe) console.log(`    axe serious/critical: dark {collapsed ${footerAxe.dark?.collapsed}, expanded ${footerAxe.dark?.expanded}, wide ${footerAxe.dark?.wide}}, light {collapsed ${footerAxe.light?.collapsed}, expanded ${footerAxe.light?.expanded}, wide ${footerAxe.light?.wide}}`)
  console.log("")
}
if (testimonialsReport) {
  console.log("  Testimonials surface (lab.html?surface=testimonials):")
  console.log(`    overflow (page) scrollWidth-clientWidth: ${WIDTHS.map((w) => `${w}px→${testimonialsReport.overflow[w]}`).join("  ")}`)
  if (testimonialsReport.internalScroll) {
    const i = testimonialsReport.internalScroll
    console.log(`    internal scroll @320: track scrolls ${i.trackScrolls} (track over ${i.trackOver}), page over ${i.pageOver}, body over ${i.bodyOver} → ${i.trackScrolls && i.pageOver <= 1 && i.bodyOver <= 1 ? "confined to track (ok)" : "FAILED"}`)
  }
  if (testimonialsReport.twoView) {
    const t = testimonialsReport.twoView
    console.log(`    two-view: 1180 {cards ${t.grid1180.cards}, allVisible ${t.grid1180.allVisible}, sameRow ${t.grid1180.sameRow}, scrolls ${t.grid1180.scrolls}} vs 320 {cards ${t.carousel320.cards}, sameRow ${t.carousel320.sameRow}, scrolls ${t.carousel320.scrolls}} → ${t.grid1180.allVisible && t.grid1180.sameRow && !t.grid1180.scrolls && t.carousel320.scrolls ? "grid-wide vs carousel-narrow (ok)" : "FAILED"}`)
  }
  if (testimonialsReport.reach) {
    const r = testimonialsReport.reach
    console.log(`    carousel reach @320: cards ${r.cards}, maxScroll ${r.maxScroll}, scrolled ${r.scrolled}, last card in view after scroll ${r.afterInView}`)
  }
  if (testimonialsReport.semantics) {
    const s = testimonialsReport.semantics
    console.log(`    semantics: rating label "${s.label}", avatar img ${s.hasImg}, initials fallback ${s.hasInitials}`)
  }
  if (testimonialsAxe) console.log(`    axe serious/critical: dark {grid ${testimonialsAxe.dark?.grid}, carousel ${testimonialsAxe.dark?.carousel}}, light {grid ${testimonialsAxe.light?.grid}, carousel ${testimonialsAxe.light?.carousel}}`)
  console.log("")
}
if (fail.length) {
  console.log("  ✗ FAILURES:\n")
  for (const f of fail) console.log(`    • ${f}`)
  console.log("")
} else {
  console.log(`    ✓ no horizontal overflow at ${WIDTHS.join("/")}px; axe WCAG2 A/AA clean (dark + light)\n`)
}
process.exit(fail.length ? 1 : 0)
