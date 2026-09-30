import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import type { A2uiTree } from "../a2ui/schema"

// CTASection pipeline/contract behavior tests (PLAN.md phase 37 t3) — TEST-AFTER (serialized on t2):
// these prove the REAL pipeline's handling of the marketing-tier CTASection declared as an A2UI
// tree, not new behavior. Every test uses the dynamic-import pattern (`await import("../pipeline")`)
// inside its async body — never a top-level static import — and references CTASection ONLY by the
// string `type: "CTASection"` (never a static symbol import of the component), matching
// `__tests__/hero.test.ts` / `__tests__/pricing.test.ts` so this file stays load-safe regardless of
// task execution order (ADR-018's dynamic-import pattern).
//
// Layout/geometry (the @container two-view), the accent-band recolor and keyboard/focus are a
// BROWSER concern (t5), NOT this file: here we assert the CONTRACT + render + injection only.
//   C1 — a valid CTASection tree (eyebrow + title + subtitle + primaryCta + secondaryCta, all
//        {it,en}) renders through the pipeline: the band, the title, both CTA labels and each href.
//   C2/C4 — malformed CTASection trees (title absent / title a bare string / primaryCta absent /
//        a primaryCta missing its href / a CTA label given as a bare string) are each rejected by
//        the pipeline's Zod pass with a NAMED error, never rendered.
//   C3 — an HTML/script payload in a text prop (title / a CTA label) is rendered inert (or
//        rejected), never as a live <script>/<img onerror> node.
//   C4 — the eyebrow/subtitle/secondaryCta fields are genuinely optional: a CTASection declared
//        without them renders primary-only.

// A well-formed, catalog-valid CTASection declaration (root node id "root", per the adapter's root
// convention). Distinctive probe strings avoid coincidental markup matches; no provider is mounted
// by the C1 render, so the i18n default ("it") resolves — the .it copy is what appears.
const validCtaTree: A2uiTree = {
  nodes: [
    {
      id: "root",
      type: "CTASection",
      props: {
        eyebrow: { it: "Pronto-EYEBROW-PROBE", en: "Ready-EYEBROW-PROBE" },
        title: { it: "Inizia-oggi-TITLE-PROBE", en: "Start-today-TITLE-PROBE" },
        subtitle: { it: "Sottotitolo-SUB-PROBE", en: "Subtitle-SUB-PROBE" },
        primaryCta: {
          label: { it: "Provalo-PRIMARY-PROBE", en: "Try-it-PRIMARY-PROBE" },
          href: "#start",
        },
        secondaryCta: {
          label: { it: "Scopri-come-SECONDARY-PROBE", en: "See-how-SECONDARY-PROBE" },
          href: "#more",
        },
      },
    },
  ],
}

// Deep-clone a tree so each test can mutate its own copy without leaking into the shared literal.
function clone(tree: A2uiTree): A2uiTree {
  return JSON.parse(JSON.stringify(tree)) as A2uiTree
}

function ctaProps(tree: A2uiTree): Record<string, unknown> {
  const root = tree.nodes.find((node) => node.id === "root")
  if (!root) throw new Error("test tree missing root node")
  return root.props as Record<string, unknown>
}

describe("renderConversation — renders a valid CTASection declaration (C1)", () => {
  it("exits and the static markup carries the band, the title, both CTA labels and each href", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(validCtaTree))

    // The CTASection really mounted (its accent-band data-slot is in the DOM), not some fallback.
    expect(html).toContain('data-slot="cta"')
    // Declared {it,en} copy resolves through the "it" default and appears as escaped text.
    expect(html).toContain("Inizia-oggi-TITLE-PROBE")
    expect(html).toContain("Provalo-PRIMARY-PROBE")
    expect(html).toContain("Scopri-come-SECONDARY-PROBE")
    // Each CTA is a real anchor carrying its declared href.
    expect(html).toContain('href="#start"')
    expect(html).toContain('href="#more"')
    // No {it,en} object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})

describe("renderConversation — rejects malformed CTASection props before rendering (C2/C4)", () => {
  it("throws InvalidComponentPropsError naming CTASection/title when title is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validCtaTree)
    delete ctaProps(tree).title

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("CTASection")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("CTASection")
    expect(error.message).toContain("title")
    // The error is well-formed: it never interpolates an object as "[object Object]".
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/Pricing convention): `title` is required, so its missing-field Zod message
    // legitimately contains "undefined" (expected object, received undefined) — not asserted here.
  })

  it("throws InvalidComponentPropsError naming CTASection/title when title is a bare string", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validCtaTree)
    ctaProps(tree).title = "just a string, not {it,en}"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("CTASection")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("CTASection")
    expect(error.message).toContain("title")
    // A wrong-TYPE prop (object expected, string given) yields a clean message with no stray
    // interpolation placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming CTASection/primaryCta when primaryCta is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validCtaTree)
    delete ctaProps(tree).primaryCta

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("CTASection")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("CTASection")
    expect(error.message).toContain("primaryCta")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/Pricing convention): `primaryCta` is required, so its missing-field Zod message
    // legitimately contains "undefined" — not asserted against here.
  })

  it("throws InvalidComponentPropsError naming CTASection/href when primaryCta omits its href", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validCtaTree)
    delete (ctaProps(tree).primaryCta as Record<string, unknown>).href

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("CTASection")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("CTASection")
    // The offending prop path (primaryCta.href) is named.
    expect(error.message).toContain("href")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/Pricing convention): `href` is required, so its missing-field Zod message
    // legitimately contains "undefined" (expected string, received undefined) — not asserted here.
  })

  it("throws InvalidComponentPropsError naming CTASection/label when primaryCta.label is a bare string", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validCtaTree)
    ;(ctaProps(tree).primaryCta as Record<string, unknown>).label = "just a string, not {it,en}"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("CTASection")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("CTASection")
    expect(error.message).toContain("label")
    // A wrong-TYPE prop (object expected, string given) yields a clean message with no placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })
})

describe("renderConversation — CTASection never emits a live HTML/script payload (C3)", () => {
  it("escapes a <script> payload in the title (rejected or rendered inert, never live)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validCtaTree)
    const payload = "<script>alert(1)</script>"
    ctaProps(tree).title = { it: payload, en: payload }

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

  it("escapes an <img src=x onerror=...> payload in a CTA label (rejected or rendered inert)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validCtaTree)
    const payload = "<img src=x onerror=alert(1)>"
    ;(ctaProps(tree).primaryCta as Record<string, unknown>).label = { it: payload, en: payload }

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

describe("renderConversation — CTASection eyebrow/subtitle/secondaryCta are genuinely optional (C4)", () => {
  it("renders primary-only when eyebrow/subtitle/secondaryCta are omitted: title + primary present, omitted strings absent", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validCtaTree)
    delete ctaProps(tree).eyebrow
    delete ctaProps(tree).subtitle
    delete ctaProps(tree).secondaryCta

    const html = renderToStaticMarkup(renderConversation(tree))

    // The CTASection rendered successfully with only the required fields (C4b).
    expect(html).toContain('data-slot="cta"')
    // The title and the single primary CTA still appear.
    expect(html).toContain("Inizia-oggi-TITLE-PROBE")
    expect(html).toContain("Provalo-PRIMARY-PROBE")
    expect(html).toContain('href="#start"')
    // None of the removed optional strings leak into the primary-only render.
    expect(html).not.toContain("Pronto-EYEBROW-PROBE")
    expect(html).not.toContain("Sottotitolo-SUB-PROBE")
    expect(html).not.toContain("Scopri-come-SECONDARY-PROBE")
    expect(html).not.toContain('href="#more"')
    // No object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})
