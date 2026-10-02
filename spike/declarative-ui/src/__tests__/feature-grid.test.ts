import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import type { A2uiTree } from "../a2ui/schema"

// FeatureGrid pipeline/contract behavior tests (PLAN.md phase 34 t6) — TEST-AFTER (serialized on
// t3): these prove the REAL pipeline's handling of the marketing-tier FeatureGrid declared as an
// A2UI tree, not new behavior. Every test uses the dynamic-import pattern
// (`await import("../pipeline")`) inside its async body — never a top-level static import — and
// references FeatureGrid ONLY by the string `type: "FeatureGrid"` (never a static symbol import of
// the component), matching `__tests__/hero.test.ts` so this file stays load-safe regardless of task
// execution order (ADR-018's dynamic-import pattern).
//
// The trees below are hand-built (not fixtures) so each test can mutate its own copy:
//   C1 — a valid FeatureGrid tree (an {it,en} heading + two items with allowed icons and {it,en}
//        title/description) renders through the pipeline, glyphs resolved.
//   C2 — malformed FeatureGrid trees (item missing title / title a bare string / items absent) are
//        each rejected by the pipeline's Zod pass with a NAMED error, never rendered.
//   C3 — an unknown icon name is refused at the owned enum; an HTML/script payload in a text prop is
//        rendered inert (or rejected), never as a live <script>/<img onerror> node.
//   C4 — the heading fields are genuinely optional: a grid declared without them renders grid-only.

// A well-formed, catalog-valid FeatureGrid declaration (root node id "root", per the adapter's root
// convention). Distinctive probe strings avoid coincidental markup matches; no provider is mounted
// by the C1 render, so the i18n default ("it") resolves — the .it copy is what appears. The heading
// probes are DISTINCT from the item probes so an absence check (C4) can't match by accident.
const validFeatureGridTree: A2uiTree = {
  nodes: [
    {
      id: "root",
      type: "FeatureGrid",
      props: {
        eyebrow: { it: "Eyebrow-HEAD-PROBE", en: "Eyebrow-HEAD-PROBE-EN" },
        title: { it: "Titolo-HEAD-PROBE", en: "Title-HEAD-PROBE-EN" },
        subtitle: { it: "Sottotitolo-HEAD-PROBE", en: "Subtitle-HEAD-PROBE-EN" },
        items: [
          {
            icon: "zap",
            title: { it: "ItemUno-TITLE-PROBE", en: "ItemOne-TITLE-PROBE-EN" },
            description: { it: "ItemUno-DESC-PROBE", en: "ItemOne-DESC-PROBE-EN" },
          },
          {
            icon: "bot",
            title: { it: "ItemDue-TITLE-PROBE", en: "ItemTwo-TITLE-PROBE-EN" },
            description: { it: "ItemDue-DESC-PROBE", en: "ItemTwo-DESC-PROBE-EN" },
          },
        ],
      },
    },
  ],
}

// Deep-clone a tree so each test can mutate its own copy without leaking into the shared literal.
function clone(tree: A2uiTree): A2uiTree {
  return JSON.parse(JSON.stringify(tree)) as A2uiTree
}

function gridProps(tree: A2uiTree): Record<string, unknown> {
  const root = tree.nodes.find((node) => node.id === "root")
  if (!root) throw new Error("test tree missing root node")
  return root.props as Record<string, unknown>
}

function gridItems(tree: A2uiTree): Array<Record<string, unknown>> {
  return gridProps(tree).items as Array<Record<string, unknown>>
}

describe("renderConversation — renders a valid FeatureGrid declaration (C1)", () => {
  it("exits and the static markup carries the heading, every item's copy, and a resolved glyph", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(validFeatureGridTree))

    // The FeatureGrid really mounted (its data-slot is in the DOM), not some fallback.
    expect(html).toContain('data-slot="feature-grid"')
    // Declared {it,en} copy resolves through the "it" default and appears as escaped text.
    expect(html).toContain("Titolo-HEAD-PROBE")
    expect(html).toContain("ItemUno-TITLE-PROBE")
    expect(html).toContain("ItemUno-DESC-PROBE")
    expect(html).toContain("ItemDue-TITLE-PROBE")
    expect(html).toContain("ItemDue-DESC-PROBE")
    // The icon name resolved to a REAL lucide glyph, rendered as an inline <svg> (C3a).
    expect(html).toContain("<svg")
  })
})

describe("renderConversation — rejects malformed FeatureGrid props before rendering (C2)", () => {
  it("throws InvalidComponentPropsError naming FeatureGrid/title when an item's title is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFeatureGridTree)
    delete gridItems(tree)[0].title

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("FeatureGrid")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("FeatureGrid")
    // The offending prop path (items.0.title) is named — "title" is in the message.
    expect(error.message).toContain("title")
    // The error is well-formed: it never interpolates an object as "[object Object]".
    expect(error.message).not.toContain("[object Object]")
    // NOTE (per t6): a MISSING required field's Zod message legitimately contains the word
    // "undefined" (expected object, received undefined), so this case does NOT assert against it.
  })

  it("throws InvalidComponentPropsError naming FeatureGrid/title when an item's title is a bare string", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFeatureGridTree)
    gridItems(tree)[0].title = "just a string, not {it,en}"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("FeatureGrid")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("FeatureGrid")
    expect(error.message).toContain("title")
    // A wrong-TYPE prop (object expected, string given) yields a clean message with no stray
    // interpolation placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming FeatureGrid/items when items is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFeatureGridTree)
    delete gridProps(tree).items

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("FeatureGrid")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("FeatureGrid")
    // The offending prop (items) is named.
    expect(error.message).toContain("items")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (per t6): `items` is required, so its missing-field Zod message legitimately contains
    // "undefined" (expected array, received undefined) — that word is not asserted against here.
  })
})

describe("renderConversation — FeatureGrid enforces the owned icon enum and never emits live markup (C3)", () => {
  it("throws InvalidComponentPropsError (not a crash) for an unknown icon name", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFeatureGridTree)
    gridItems(tree)[0].icon = "totally-not-a-real-icon"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    // The enum refuses it at the pipeline boundary — a NAMED contract error, never a TypeError from
    // a missing ICONS[...] entry.
    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("FeatureGrid")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("FeatureGrid")
    expect(error.message).toContain("icon")
    expect(error.message).not.toContain("[object Object]")
  })

  it("escapes a <script> payload in a text prop (rejected or rendered inert, never live)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validFeatureGridTree)
    const payload = "<script>alert(1)</script>"
    gridItems(tree)[0].description = { it: payload, en: payload }

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

  it("escapes an <img src=x onerror=...> payload in a text prop (rejected or rendered inert)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validFeatureGridTree)
    const payload = "<img src=x onerror=alert(1)>"
    gridItems(tree)[0].title = { it: payload, en: payload }

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

describe("renderConversation — FeatureGrid heading fields are genuinely optional (C4)", () => {
  it("renders grid-only when eyebrow/title/subtitle are omitted: item copy present, heading strings absent", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validFeatureGridTree)
    delete gridProps(tree).eyebrow
    delete gridProps(tree).title
    delete gridProps(tree).subtitle

    const html = renderToStaticMarkup(renderConversation(tree))

    // The grid rendered successfully with no heading fields (C4b).
    expect(html).toContain('data-slot="feature-grid"')
    // Every item's copy still appears.
    expect(html).toContain("ItemUno-TITLE-PROBE")
    expect(html).toContain("ItemUno-DESC-PROBE")
    expect(html).toContain("ItemDue-TITLE-PROBE")
    expect(html).toContain("ItemDue-DESC-PROBE")
    // None of the removed heading strings leak into the grid-only render.
    expect(html).not.toContain("Eyebrow-HEAD-PROBE")
    expect(html).not.toContain("Titolo-HEAD-PROBE")
    expect(html).not.toContain("Sottotitolo-HEAD-PROBE")
    // No object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})
