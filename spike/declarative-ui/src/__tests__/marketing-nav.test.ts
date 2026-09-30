import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import type { A2uiTree } from "../a2ui/schema"

// MarketingNav pipeline/contract behavior tests (PLAN.md phase 38 t6) — TEST-AFTER (serialized on
// t3): these prove the REAL pipeline's handling of the marketing-tier MarketingNav declared as an
// A2UI tree, not new behavior. Every test uses the dynamic-import pattern (`await import("../pipeline")`)
// inside its async body — never a top-level static import — and references MarketingNav ONLY by the
// string `type: "MarketingNav"` (never a static symbol import of the component), matching
// `__tests__/cta-section.test.ts` / `__tests__/pricing.test.ts` so this file stays load-safe
// regardless of task execution order (ADR-018's dynamic-import pattern).
//
// The hamburger/drawer open+close and the sticky/@container two-view are a BROWSER concern (t5),
// NOT this file: here we assert the CONTRACT + render + injection only.
//   C1 — a valid MarketingNav tree (brand {it,en} + brandIcon from the enum + links + primaryCta +
//        secondaryCta, all {it,en}) renders through the pipeline: the nav slot, the brand name,
//        every link label + href on an <a>, both CTA labels + href, a resolved lucide <svg>.
//   C2/C4 — malformed MarketingNav trees (brand absent / brand.name a bare string / primaryCta
//        absent / primaryCta missing its href / a brandIcon outside the enum) are each rejected by
//        the pipeline's Zod pass with a NAMED error, never rendered.
//   C3 — an HTML/script payload in a text prop (brand name / a link label) is rendered inert (or
//        rejected), never as a live <script>/<img onerror> node.
//   C4 — brandIcon/links/secondaryCta are genuinely optional: a MarketingNav declared without them
//        renders brand + primary only.

// A well-formed, catalog-valid MarketingNav declaration (root node id "root", per the adapter's
// root convention). Distinctive probe strings avoid coincidental markup matches; no provider is
// mounted by the C1 render, so the i18n default ("it") resolves — the .it copy is what appears.
const validNavTree: A2uiTree = {
  nodes: [
    {
      id: "root",
      type: "MarketingNav",
      props: {
        brand: {
          name: { it: "Marca-BRAND-PROBE", en: "Brand-BRAND-PROBE-EN" },
          brandIcon: "bot",
        },
        links: [
          { label: { it: "Prezzi-LINK1-PROBE", en: "Pricing-LINK1-PROBE-EN" }, href: "#prezzi" },
          { label: { it: "Funzioni-LINK2-PROBE", en: "Features-LINK2-PROBE-EN" }, href: "#funzioni" },
          { label: { it: "Contatti-LINK3-PROBE", en: "Contact-LINK3-PROBE-EN" }, href: "#contatti" },
        ],
        primaryCta: {
          label: { it: "Inizia-PRIMARY-PROBE", en: "Start-PRIMARY-PROBE-EN" },
          href: "#inizia",
        },
        secondaryCta: {
          label: { it: "Accedi-SECONDARY-PROBE", en: "Login-SECONDARY-PROBE-EN" },
          href: "#accedi",
        },
      },
    },
  ],
}

// Deep-clone a tree so each test can mutate its own copy without leaking into the shared literal.
function clone(tree: A2uiTree): A2uiTree {
  return JSON.parse(JSON.stringify(tree)) as A2uiTree
}

function navProps(tree: A2uiTree): Record<string, unknown> {
  const root = tree.nodes.find((node) => node.id === "root")
  if (!root) throw new Error("test tree missing root node")
  return root.props as Record<string, unknown>
}

function navLinks(tree: A2uiTree): Array<Record<string, unknown>> {
  return navProps(tree).links as Array<Record<string, unknown>>
}

describe("renderConversation — renders a valid MarketingNav declaration (C1)", () => {
  it("exits and the static markup carries the nav slot, the brand name, every link + href, both CTAs + href and a resolved glyph", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(validNavTree))

    // The MarketingNav really mounted (its sticky-bar data-slot is in the DOM), not some fallback.
    expect(html).toContain('data-slot="nav"')
    // The declared {it,en} brand copy resolves through the "it" default and appears as text.
    expect(html).toContain("Marca-BRAND-PROBE")
    // Every declared link label resolves.
    expect(html).toContain("Prezzi-LINK1-PROBE")
    expect(html).toContain("Funzioni-LINK2-PROBE")
    expect(html).toContain("Contatti-LINK3-PROBE")
    // Every link's href is present on an anchor.
    expect(html).toContain('href="#prezzi"')
    expect(html).toContain('href="#funzioni"')
    expect(html).toContain('href="#contatti"')
    // Both CTA labels resolve and each carries its declared href.
    expect(html).toContain("Inizia-PRIMARY-PROBE")
    expect(html).toContain("Accedi-SECONDARY-PROBE")
    expect(html).toContain('href="#inizia"')
    expect(html).toContain('href="#accedi"')
    // A name-token icon (brandIcon/hamburger) resolved to a REAL lucide inline <svg> (C3b).
    expect(html).toContain("<svg")
    // No {it,en} object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})

describe("renderConversation — rejects malformed MarketingNav props before rendering (C2/C4)", () => {
  it("throws InvalidComponentPropsError naming MarketingNav/brand when brand is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validNavTree)
    delete navProps(tree).brand

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("MarketingNav")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("MarketingNav")
    expect(error.message).toContain("brand")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/Pricing convention): `brand` is required, so its missing-field Zod message
    // legitimately contains "undefined" (expected object, received undefined) — not asserted here.
  })

  it("throws InvalidComponentPropsError naming MarketingNav/name when brand.name is a bare string", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validNavTree)
    ;(navProps(tree).brand as Record<string, unknown>).name = "just a string, not {it,en}"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("MarketingNav")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("MarketingNav")
    expect(error.message).toContain("name")
    // A wrong-TYPE prop (object expected, string given) yields a clean message with no stray
    // interpolation placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming MarketingNav/primaryCta when primaryCta is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validNavTree)
    delete navProps(tree).primaryCta

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("MarketingNav")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("MarketingNav")
    expect(error.message).toContain("primaryCta")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/Pricing convention): `primaryCta` is required, so its missing-field Zod message
    // legitimately contains "undefined" — not asserted against here.
  })

  it("throws InvalidComponentPropsError naming MarketingNav/href when primaryCta omits its href", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validNavTree)
    delete (navProps(tree).primaryCta as Record<string, unknown>).href

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("MarketingNav")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("MarketingNav")
    // The offending prop path (primaryCta.href) is named.
    expect(error.message).toContain("href")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/Pricing convention): `href` is required, so its missing-field Zod message
    // legitimately contains "undefined" (expected string, received undefined) — not asserted here.
  })

  it("throws InvalidComponentPropsError naming MarketingNav/brandIcon when brandIcon is outside the enum", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validNavTree)
    ;(navProps(tree).brand as Record<string, unknown>).brandIcon = "not-a-real-icon"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("MarketingNav")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("MarketingNav")
    // The offending prop path (brand.brandIcon) is named; the message also enumerates the curated
    // icon vocabulary. (Zod v4's enum message lists the allowed options rather than echoing the
    // rejected value, so the raw "not-a-real-icon" string is intentionally not asserted here.)
    expect(error.message).toContain("brandIcon")
    // A wrong-value enum (a name outside the curated set) yields a clean message with no stray
    // interpolation placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })
})

describe("renderConversation — MarketingNav never emits a live HTML/script payload (C3)", () => {
  it("escapes a <script> payload in the brand name (rejected or rendered inert, never live)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validNavTree)
    const payload = "<script>alert(1)</script>"
    ;(navProps(tree).brand as Record<string, unknown>).name = { it: payload, en: payload }

    let caught: unknown
    let html = ""
    try {
      html = renderToStaticMarkup(renderConversation(tree))
    } catch (error) {
      caught = error
    }

    if (caught) {
      // Acceptable outcome: rejected with a NAMED pipeline error (never a silent pass).
      expect((caught as Error).name).toMatch(
        /InvalidComponentPropsError|UnknownComponentTypeError|MissingRootNodeError/,
      )
    } else {
      // Rendered inert: no live <script> node, the payload survives only escaped.
      expect(html).not.toContain("<script")
      expect(html).not.toContain("</script>")
      expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
    }
  })

  it("escapes an <img src=x onerror=...> payload in a link label (rejected or rendered inert)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validNavTree)
    const payload = "<img src=x onerror=alert(1)>"
    navLinks(tree)[0].label = { it: payload, en: payload }

    let caught: unknown
    let html = ""
    try {
      html = renderToStaticMarkup(renderConversation(tree))
    } catch (error) {
      caught = error
    }

    if (caught) {
      expect((caught as Error).name).toMatch(
        /InvalidComponentPropsError|UnknownComponentTypeError|MissingRootNodeError/,
      )
    } else {
      // No live injected <img onerror> node; the payload survives only as escaped text.
      expect(html).not.toContain("<script")
      expect(html).not.toContain("<img src=x onerror")
      expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;")
    }
  })
})

describe("renderConversation — MarketingNav brandIcon/links/secondaryCta are genuinely optional (C4)", () => {
  it("renders brand + primary only when brandIcon/links/secondaryCta are omitted: none of the omitted content leaks", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validNavTree)
    delete (navProps(tree).brand as Record<string, unknown>).brandIcon
    delete navProps(tree).links
    delete navProps(tree).secondaryCta

    const html = renderToStaticMarkup(renderConversation(tree))

    // The MarketingNav rendered successfully with only the required fields (C4b).
    expect(html).toContain('data-slot="nav"')
    // The brand name and the single primary CTA still appear.
    expect(html).toContain("Marca-BRAND-PROBE")
    expect(html).toContain("Inizia-PRIMARY-PROBE")
    expect(html).toContain('href="#inizia"')
    // None of the removed optional content leaks into the brand + primary render.
    expect(html).not.toContain("Prezzi-LINK1-PROBE")
    expect(html).not.toContain("Funzioni-LINK2-PROBE")
    expect(html).not.toContain("Contatti-LINK3-PROBE")
    expect(html).not.toContain("Accedi-SECONDARY-PROBE")
    expect(html).not.toContain('href="#accedi"')
    // No object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})
