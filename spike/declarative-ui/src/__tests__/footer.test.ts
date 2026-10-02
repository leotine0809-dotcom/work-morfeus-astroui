import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import type { A2uiTree } from "../a2ui/schema"

// Footer pipeline/contract behavior tests (PLAN.md phase 39 t6) — TEST-AFTER (serialized on t3):
// these prove the REAL pipeline's handling of the marketing-tier Footer declared as an A2UI tree,
// not new behavior. Every test uses the dynamic-import pattern (`await import("../pipeline")`) inside
// its async body — never a top-level static import — and references the Footer ONLY by the string
// `type: "Footer"` (never a static symbol import of the component), matching `__tests__/faq.test.ts`
// / `__tests__/marketing-nav.test.ts` so this file stays load-safe regardless of task execution
// order (ADR-018's dynamic-import pattern).
//
// The narrow accordion's expand/collapse CLICK behavior and the @container two-view are a BROWSER
// concern (t5), NOT this file: here we assert the CONTRACT + render + injection only. The render
// probe uses `renderToStaticMarkup`, so BOTH view branches (the narrow collapsible accordion columns
// and the wide always-open grid) are present in the static markup and every heading/link string
// appears once per branch: assert `toContain`, never counts.
//   C1 — a valid Footer tree (full anatomy: brand name + brandIcon + tagline, 2 columns each with
//        links, a social[] of 2, bottom copyright + legalLinks) renders through the pipeline: the
//        footer slot, the brand name, every column heading + link label, each link/legal/social an
//        anchor to its href, a resolved lucide <svg>, no [object Object].
//   C2/C4 — malformed Footer trees (brand absent / brand.name a bare string / columns absent /
//        columns not an array / columns empty [].min(1) / a column with empty links [].min(1) /
//        bottom absent / a social[].icon outside the enum) are each rejected by the pipeline's Zod
//        pass with a NAMED error, never rendered.
//   C3 — an HTML/script payload in a text prop (brand name / a column link label / copyright) is
//        rendered inert (or rejected), never as a live <script>/<img onerror> node.
//   C4b — brandIcon/tagline/social/legalLinks are genuinely optional: a Footer declared without them
//        renders brand + columns + copyright only, none of the omitted content leaking.

// A well-formed, catalog-valid Footer declaration (root node id "root", per the adapter's root
// convention). Distinctive probe strings avoid coincidental markup matches; no provider is mounted
// by the C1 render, so the i18n default ("it") resolves — the .it copy is what appears.
const validFooterTree: A2uiTree = {
  nodes: [
    {
      id: "root",
      type: "Footer",
      props: {
        brand: {
          name: { it: "Marca-BRAND-PROBE", en: "Brand-BRAND-PROBE-EN" },
          brandIcon: "bot",
          tagline: { it: "Slogan-TAGLINE-PROBE", en: "Tagline-TAGLINE-PROBE-EN" },
        },
        columns: [
          {
            heading: { it: "Prodotti-COL1-PROBE", en: "Products-COL1-PROBE-EN" },
            links: [
              { label: { it: "Prezzi-L1-PROBE", en: "Pricing-L1-PROBE-EN" }, href: "#prezzi" },
              { label: { it: "Funzioni-L2-PROBE", en: "Features-L2-PROBE-EN" }, href: "#funzioni" },
            ],
          },
          {
            heading: { it: "Azienda-COL2-PROBE", en: "Company-COL2-PROBE-EN" },
            links: [
              { label: { it: "Chi-siamo-L3-PROBE", en: "About-L3-PROBE-EN" }, href: "#chi-siamo" },
              { label: { it: "Contatti-L4-PROBE", en: "Contact-L4-PROBE-EN" }, href: "#contatti" },
            ],
          },
        ],
        social: [
          { icon: "at-sign", href: "#social-mail", label: { it: "Scrivici-S1-PROBE", en: "Email-S1-PROBE-EN" } },
          { icon: "send", href: "#social-send", label: { it: "Messaggio-S2-PROBE", en: "Message-S2-PROBE-EN" } },
        ],
        bottom: {
          copyright: { it: "Diritti-COPY-PROBE", en: "Rights-COPY-PROBE-EN" },
          legalLinks: [
            { label: { it: "Privacy-LEGAL1-PROBE", en: "Privacy-LEGAL1-PROBE-EN" }, href: "#privacy" },
            { label: { it: "Termini-LEGAL2-PROBE", en: "Terms-LEGAL2-PROBE-EN" }, href: "#termini" },
          ],
        },
      },
    },
  ],
}

// Deep-clone a tree so each test can mutate its own copy without leaking into the shared literal.
function clone(tree: A2uiTree): A2uiTree {
  return JSON.parse(JSON.stringify(tree)) as A2uiTree
}

function footerProps(tree: A2uiTree): Record<string, unknown> {
  const root = tree.nodes.find((node) => node.id === "root")
  if (!root) throw new Error("test tree missing root node")
  return root.props as Record<string, unknown>
}

function footerBrand(tree: A2uiTree): Record<string, unknown> {
  return footerProps(tree).brand as Record<string, unknown>
}

function footerColumns(tree: A2uiTree): Array<Record<string, unknown>> {
  return footerProps(tree).columns as Array<Record<string, unknown>>
}

function footerColumnLinks(tree: A2uiTree, i: number): Array<Record<string, unknown>> {
  return footerColumns(tree)[i].links as Array<Record<string, unknown>>
}

function footerSocial(tree: A2uiTree): Array<Record<string, unknown>> {
  return footerProps(tree).social as Array<Record<string, unknown>>
}

function footerBottom(tree: A2uiTree): Record<string, unknown> {
  return footerProps(tree).bottom as Record<string, unknown>
}

describe("renderConversation — renders a valid Footer declaration (C1)", () => {
  it("exits and the static markup carries the footer slot, the brand name, every column heading + link, each link/legal/social href, the copyright and a resolved glyph", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(validFooterTree))

    // The Footer really mounted (its data-slot is in the DOM), not some fallback.
    expect(html).toContain('data-slot="footer"')
    // The declared {it,en} brand copy resolves through the "it" default and appears as text.
    expect(html).toContain("Marca-BRAND-PROBE")
    // The optional tagline resolves and appears.
    expect(html).toContain("Slogan-TAGLINE-PROBE")
    // Every column heading resolves (present in BOTH the narrow and the wide branch markup).
    expect(html).toContain("Prodotti-COL1-PROBE")
    expect(html).toContain("Azienda-COL2-PROBE")
    // Every column link label resolves (both branches render each label in static markup).
    expect(html).toContain("Prezzi-L1-PROBE")
    expect(html).toContain("Funzioni-L2-PROBE")
    expect(html).toContain("Chi-siamo-L3-PROBE")
    expect(html).toContain("Contatti-L4-PROBE")
    // Every column link's href is present on an anchor.
    expect(html).toContain('href="#prezzi"')
    expect(html).toContain('href="#funzioni"')
    expect(html).toContain('href="#chi-siamo"')
    expect(html).toContain('href="#contatti"')
    // Each social link carries its accessible name (from {it,en} label) and its declared href.
    expect(html).toContain("Scrivici-S1-PROBE")
    expect(html).toContain("Messaggio-S2-PROBE")
    expect(html).toContain('href="#social-mail"')
    expect(html).toContain('href="#social-send"')
    // The bottom copyright resolves.
    expect(html).toContain("Diritti-COPY-PROBE")
    // Every legal link label resolves and carries its href.
    expect(html).toContain("Privacy-LEGAL1-PROBE")
    expect(html).toContain("Termini-LEGAL2-PROBE")
    expect(html).toContain('href="#privacy"')
    expect(html).toContain('href="#termini"')
    // The owned brand/social glyphs resolved to REAL lucide inline <svg> elements (C3b).
    expect(html).toContain("<svg")
    // No {it,en} object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})

describe("renderConversation — rejects malformed Footer props before rendering (C2/C4)", () => {
  it("throws InvalidComponentPropsError naming Footer/brand when brand is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFooterTree)
    delete footerProps(tree).brand

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Footer")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Footer")
    expect(error.message).toContain("brand")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/FAQ/MarketingNav convention): `brand` is required, so its missing-field Zod message
    // legitimately contains "undefined" (expected object, received undefined) — not asserted here.
  })

  it("throws InvalidComponentPropsError naming Footer/name when brand.name is a bare string", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFooterTree)
    footerBrand(tree).name = "just a string, not {it,en}"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Footer")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Footer")
    expect(error.message).toContain("name")
    // A wrong-TYPE prop (object expected, string given) yields a clean message with no stray
    // interpolation placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming Footer/columns when columns is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFooterTree)
    delete footerProps(tree).columns

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Footer")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Footer")
    expect(error.message).toContain("columns")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (convention): `columns` is required, so its missing-field Zod message legitimately
    // contains "undefined" (expected array, received undefined) — not asserted against here.
  })

  it("throws InvalidComponentPropsError naming Footer/columns when columns is not an array", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFooterTree)
    footerProps(tree).columns = "not-an-array"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Footer")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Footer")
    expect(error.message).toContain("columns")
    // A wrong-TYPE prop (array expected, string given) yields a clean message with no placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming Footer/columns when columns is empty (the .min(1) guard)", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFooterTree)
    footerProps(tree).columns = []

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    // An empty columns array is a contract error (the schema requires .min(1)), never rendered.
    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Footer")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Footer")
    expect(error.message).toContain("columns")
    expect(error.message).not.toContain("[object Object]")
  })

  it("throws InvalidComponentPropsError naming Footer/links when a column has an empty links array (the .min(1) guard)", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFooterTree)
    footerColumns(tree)[0].links = []

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    // A column with no links is a contract error (links requires .min(1)), never rendered.
    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Footer")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Footer")
    expect(error.message).toContain("links")
    expect(error.message).not.toContain("[object Object]")
  })

  it("throws InvalidComponentPropsError naming Footer/bottom when bottom is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFooterTree)
    delete footerProps(tree).bottom

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Footer")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Footer")
    expect(error.message).toContain("bottom")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (convention): `bottom` is required, so its missing-field Zod message legitimately contains
    // "undefined" (expected object, received undefined) — not asserted against here.
  })

  it("throws InvalidComponentPropsError naming Footer/icon when a social entry uses an icon outside the enum", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFooterTree)
    footerSocial(tree)[0].icon = "not-a-real-icon"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Footer")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Footer")
    // The offending prop path (social.0.icon) is named; the message also enumerates the curated icon
    // vocabulary. (Zod v4's enum message lists the allowed options rather than echoing the rejected
    // value, so the raw "not-a-real-icon" string is intentionally not asserted here.)
    expect(error.message).toContain("icon")
    // A wrong-value enum (a name outside the curated set) yields a clean message with no stray
    // interpolation placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })
})

describe("renderConversation — Footer never emits a live HTML/script payload (C3)", () => {
  it("escapes a <script> payload in the brand name (rejected or rendered inert, never live)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validFooterTree)
    const payload = "<script>alert(1)</script>"
    footerBrand(tree).name = { it: payload, en: payload }

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
      expect(html).not.toContain("[object Object]")
    }
  })

  it("escapes an <img src=x onerror=...> payload in a column link label (rejected or rendered inert)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validFooterTree)
    const payload = "<img src=x onerror=alert(1)>"
    footerColumnLinks(tree, 0)[0].label = { it: payload, en: payload }

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
      expect(html).not.toContain("[object Object]")
    }
  })

  it("escapes a <script> payload in the bottom copyright (rejected or rendered inert)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validFooterTree)
    const payload = "<script>alert(document.cookie)</script>"
    footerBottom(tree).copyright = { it: payload, en: payload }

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
      // No live <script> node; the payload survives only escaped.
      expect(html).not.toContain("<script")
      expect(html).not.toContain("</script>")
      expect(html).toContain("&lt;script&gt;alert(document.cookie)&lt;/script&gt;")
      expect(html).not.toContain("[object Object]")
    }
  })
})

describe("renderConversation — Footer brandIcon/tagline/social/legalLinks are genuinely optional (C4b)", () => {
  it("renders brand + columns + copyright only when brandIcon/tagline/social/legalLinks are omitted: none of the omitted content leaks", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validFooterTree)
    delete footerBrand(tree).brandIcon
    delete footerBrand(tree).tagline
    delete footerProps(tree).social
    delete footerBottom(tree).legalLinks

    const html = renderToStaticMarkup(renderConversation(tree))

    // The Footer rendered successfully with only the required fields (C4b).
    expect(html).toContain('data-slot="footer"')
    // The brand name, every column heading + link, and the copyright still appear.
    expect(html).toContain("Marca-BRAND-PROBE")
    expect(html).toContain("Prodotti-COL1-PROBE")
    expect(html).toContain("Azienda-COL2-PROBE")
    expect(html).toContain("Prezzi-L1-PROBE")
    expect(html).toContain("Contatti-L4-PROBE")
    expect(html).toContain("Diritti-COPY-PROBE")
    // None of the removed optional content leaks into the render.
    expect(html).not.toContain("Slogan-TAGLINE-PROBE")
    expect(html).not.toContain("Scrivici-S1-PROBE")
    expect(html).not.toContain("Messaggio-S2-PROBE")
    expect(html).not.toContain("Privacy-LEGAL1-PROBE")
    expect(html).not.toContain("Termini-LEGAL2-PROBE")
    expect(html).not.toContain('href="#social-mail"')
    expect(html).not.toContain('href="#privacy"')
    // No object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})
