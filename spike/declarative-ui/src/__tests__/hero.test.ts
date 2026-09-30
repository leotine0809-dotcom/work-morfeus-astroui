import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import type { A2uiTree } from "../a2ui/schema"

// Hero pipeline/contract behavior tests (PLAN.md phase 33 t6) — TEST-AFTER (serialized on t3):
// these prove the REAL pipeline's handling of the marketing-tier Hero declared as an A2UI tree,
// not new behavior. Every test uses the dynamic-import pattern (`await import("../pipeline")`)
// inside its async body — never a top-level static import — and references Hero ONLY by the
// string `type: "Hero"` (never a static symbol import of the component), matching
// `__tests__/reject.test.ts` so this file stays load-safe regardless of task execution order
// (ADR-018's dynamic-import pattern).
//
// The three A2UI trees below are hand-built (not fixtures) so each test can mutate its own copy:
//   C1 — a valid Hero tree ({it,en} copy + a media descriptor) renders through the pipeline.
//   C2 — three malformed Hero trees are each rejected by the pipeline's Zod pass, never rendered.
//   C3 — a Hero carrying an HTML/script payload in a text prop or the media src is rendered inert
//        (or rejected), never as a live <script>/<img onerror> node.

// A well-formed, catalog-valid Hero declaration (root node id "root", per the adapter's root
// convention). Distinctive probe strings avoid coincidental markup matches; no provider is mounted
// by the C1 render, so the i18n default ("it") resolves — the .it copy is what appears.
const validHeroTree: A2uiTree = {
  nodes: [
    {
      id: "root",
      type: "Hero",
      props: {
        eyebrow: { it: "Novita-EYEBROW-PROBE", en: "Introducing-EYEBROW-PROBE" },
        title: { it: "Comanda-la-tua-flotta-PROBE", en: "Command-your-fleet-PROBE" },
        subtitle: { it: "Sottotitolo-PROBE", en: "Subtitle-PROBE" },
        primaryCta: {
          label: { it: "Inizia-ora-PRIMARY-PROBE", en: "Get-started-PRIMARY-PROBE" },
          href: "#start",
        },
        secondaryCta: {
          label: { it: "Scopri-di-piu-SECONDARY-PROBE", en: "Learn-more-SECONDARY-PROBE" },
          href: "#more",
        },
        media: {
          kind: "mockup",
          alt: { it: "Anteprima-PROBE", en: "Preview-PROBE" },
        },
      },
    },
  ],
}

// Deep-clone a tree so each test can mutate its own copy without leaking into the shared literal.
function clone(tree: A2uiTree): A2uiTree {
  return JSON.parse(JSON.stringify(tree)) as A2uiTree
}

function heroProps(tree: A2uiTree): Record<string, unknown> {
  const root = tree.nodes.find((node) => node.id === "root")
  if (!root) throw new Error("test tree missing root node")
  return root.props as Record<string, unknown>
}

describe("renderConversation — renders a valid Hero declaration (C1)", () => {
  it("exits and the static markup carries the declared title and both CTA labels", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(validHeroTree))

    // The Hero really mounted (its data-slot is in the DOM), not some fallback.
    expect(html).toContain('data-slot="hero"')
    // Declared {it,en} copy resolves through the "it" default and appears as escaped text.
    expect(html).toContain("Comanda-la-tua-flotta-PROBE")
    expect(html).toContain("Inizia-ora-PRIMARY-PROBE")
    expect(html).toContain("Scopri-di-piu-SECONDARY-PROBE")
  })
})

describe("renderConversation — rejects malformed Hero props before rendering (C2)", () => {
  it("throws InvalidComponentPropsError naming Hero/title when title is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validHeroTree)
    delete heroProps(tree).title

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Hero")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Hero")
    expect(error.message).toContain("title")
    // The error is well-formed: it never interpolates an object as "[object Object]".
    expect(error.message).not.toContain("[object Object]")
  })

  it("throws InvalidComponentPropsError naming Hero/title when title is a bare string", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validHeroTree)
    heroProps(tree).title = "just a string, not {it,en}"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Hero")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Hero")
    expect(error.message).toContain("title")
    // A wrong-TYPE prop yields a clean message with no stray interpolation placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming Hero/primaryCta when primaryCta is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validHeroTree)
    delete heroProps(tree).primaryCta

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Hero")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Hero")
    expect(error.message).toContain("primaryCta")
    expect(error.message).not.toContain("[object Object]")
  })
})

describe("renderConversation — Hero never emits a live HTML/script payload (C3)", () => {
  it("escapes a <script> payload in a text prop (rejected or rendered inert, never live)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validHeroTree)
    const payload = "<script>alert(1)</script>"
    heroProps(tree).title = { it: payload, en: payload }

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

  it("escapes an <img onerror=...> payload in the media src (rejected or rendered inert)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validHeroTree)
    const payload = "<img src=x onerror=alert(1)>"
    heroProps(tree).media = { kind: "image", src: payload, alt: { it: "a", en: "b" } }

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
      // No live injected <img onerror> node; the payload survives only as an escaped attribute value.
      expect(html).not.toContain("<script")
      expect(html).not.toContain("<img src=x onerror")
      expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;")
    }
  })
})
