import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import type { A2uiTree } from "../a2ui/schema"

// FAQ pipeline/contract behavior tests (PLAN.md phase 36 t4) — TEST-AFTER (serialized on t3): these
// prove the REAL pipeline's handling of the marketing-tier FAQ declared as an A2UI tree, not new
// behavior. Every test uses the dynamic-import pattern (`await import("../pipeline")`) inside its
// async body — never a top-level static import — and references FAQ ONLY by the string
// `type: "FAQ"` (never a static symbol import of the component), matching
// `__tests__/pricing.test.ts` / `__tests__/feature-grid.test.ts` / `__tests__/hero.test.ts` so this
// file stays load-safe regardless of task execution order (ADR-018's dynamic-import pattern).
//
// The narrow accordion's expand/collapse CLICK behavior is a BROWSER concern (t6), NOT this file:
// here we assert the CONTRACT + render + injection only. The render probe uses
// `renderToStaticMarkup`, so BOTH view branches (the narrow collapsible accordion and the wide
// always-open 2-column grid) are present in the static markup and every question/answer string
// appears once per branch: assert `toContain`, never counts.
//   C1 — a valid FAQ tree (an optional {it,en} heading + 2+ items of { question:{it,en},
//        answer:{it,en} }) renders through the pipeline, chevron glyph resolved.
//   C2/C4 — malformed FAQ trees (an item missing answer / an item missing question / a question a
//        bare string / items absent / items empty [].min(1)) are each rejected by the pipeline's Zod
//        pass with a NAMED error, never rendered.
//   C3 — an HTML/script payload in a text prop (a question / an answer) is rendered inert (or
//        rejected), never as a live <script>/<img onerror> node.
//   C4 — the heading fields are genuinely optional: an FAQ declared without them renders items-only.

// A well-formed, catalog-valid FAQ declaration (root node id "root", per the adapter's root
// convention). Distinctive probe strings avoid coincidental markup matches; no provider is mounted
// by the C1 render, so the i18n default ("it") resolves — the .it copy is what appears. The heading
// probes are DISTINCT from the item probes so an absence check (C4) can't match by accident.
const validFaqTree: A2uiTree = {
  nodes: [
    {
      id: "root",
      type: "FAQ",
      props: {
        eyebrow: { it: "Eyebrow-HEAD-PROBE", en: "Eyebrow-HEAD-PROBE-EN" },
        title: { it: "Titolo-HEAD-PROBE", en: "Title-HEAD-PROBE-EN" },
        subtitle: { it: "Sottotitolo-HEAD-PROBE", en: "Subtitle-HEAD-PROBE-EN" },
        items: [
          {
            question: { it: "DomandaUno-Q-PROBE", en: "QuestionOne-Q-PROBE-EN" },
            answer: { it: "RispostaUno-A-PROBE", en: "AnswerOne-A-PROBE-EN" },
          },
          {
            question: { it: "DomandaDue-Q-PROBE", en: "QuestionTwo-Q-PROBE-EN" },
            answer: { it: "RispostaDue-A-PROBE", en: "AnswerTwo-A-PROBE-EN" },
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

function faqProps(tree: A2uiTree): Record<string, unknown> {
  const root = tree.nodes.find((node) => node.id === "root")
  if (!root) throw new Error("test tree missing root node")
  return root.props as Record<string, unknown>
}

function faqItems(tree: A2uiTree): Array<Record<string, unknown>> {
  return faqProps(tree).items as Array<Record<string, unknown>>
}

describe("renderConversation — renders a valid FAQ declaration (C1)", () => {
  it("exits and the static markup carries the heading, every item's question and answer, and a resolved chevron glyph", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(validFaqTree))

    // The FAQ really mounted (its data-slot is in the DOM), not some fallback.
    expect(html).toContain('data-slot="faq"')
    // The declared {it,en} heading copy resolves through the "it" default and appears as text.
    expect(html).toContain("Titolo-HEAD-PROBE")
    // Every item's question resolves (present in BOTH the narrow and the wide branch markup).
    expect(html).toContain("DomandaUno-Q-PROBE")
    expect(html).toContain("DomandaDue-Q-PROBE")
    // Every item's answer resolves (both branches render the answer text in static markup).
    expect(html).toContain("RispostaUno-A-PROBE")
    expect(html).toContain("RispostaDue-A-PROBE")
    // The owned chevron glyph resolved to a REAL lucide inline <svg> on the accordion triggers (C3a).
    expect(html).toContain("<svg")
    // No {it,en} object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})

describe("renderConversation — rejects malformed FAQ props before rendering (C2/C4)", () => {
  it("throws InvalidComponentPropsError naming FAQ/answer when an item omits its answer", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFaqTree)
    delete faqItems(tree)[0].answer

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("FAQ")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("FAQ")
    // The offending prop path (items.0.answer) is named.
    expect(error.message).toContain("answer")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/FeatureGrid/Pricing convention): a MISSING required field's Zod message
    // legitimately contains "undefined" (expected object, received undefined), so this case does
    // NOT assert against it.
  })

  it("throws InvalidComponentPropsError naming FAQ/question when an item omits its question", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFaqTree)
    delete faqItems(tree)[0].question

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("FAQ")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("FAQ")
    expect(error.message).toContain("question")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (convention): `question` is required, so its missing-field Zod message legitimately
    // contains "undefined" — that word is not asserted against here.
  })

  it("throws InvalidComponentPropsError naming FAQ/question when a question is a bare string", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFaqTree)
    faqItems(tree)[0].question = "just a string, not {it,en}"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("FAQ")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("FAQ")
    expect(error.message).toContain("question")
    // A wrong-TYPE prop (object expected, string given) yields a clean message with no stray
    // interpolation placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming FAQ/items when items is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFaqTree)
    delete faqProps(tree).items

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("FAQ")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("FAQ")
    expect(error.message).toContain("items")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (convention): `items` is required, so its missing-field Zod message legitimately contains
    // "undefined" (expected array, received undefined) — not asserted against here.
  })

  it("throws InvalidComponentPropsError naming FAQ/items when items is not an array", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFaqTree)
    faqProps(tree).items = "not-an-array"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("FAQ")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("FAQ")
    expect(error.message).toContain("items")
    // A wrong-TYPE prop (array expected, string given) yields a clean message with no placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming FAQ/items when items is empty (the .min(1) guard)", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validFaqTree)
    faqProps(tree).items = []

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    // An empty items array is a contract error (the schema requires .min(1)), never rendered.
    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("FAQ")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("FAQ")
    expect(error.message).toContain("items")
    expect(error.message).not.toContain("[object Object]")
  })
})

describe("renderConversation — FAQ never emits a live HTML/script payload (C3)", () => {
  it("escapes a <script> payload in a question (rejected or rendered inert, never live)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validFaqTree)
    const payload = "<script>alert(1)</script>"
    faqItems(tree)[0].question = { it: payload, en: payload }

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

  it("escapes an <img src=x onerror=...> payload in an answer (rejected or rendered inert)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validFaqTree)
    const payload = "<img src=x onerror=alert(1)>"
    faqItems(tree)[0].answer = { it: payload, en: payload }

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

describe("renderConversation — FAQ heading fields are genuinely optional (C4)", () => {
  it("renders items-only when eyebrow/title/subtitle are omitted: item copy present, heading strings absent", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validFaqTree)
    delete faqProps(tree).eyebrow
    delete faqProps(tree).title
    delete faqProps(tree).subtitle

    const html = renderToStaticMarkup(renderConversation(tree))

    // The FAQ rendered successfully with no heading fields (C4b).
    expect(html).toContain('data-slot="faq"')
    // Every item's copy still appears.
    expect(html).toContain("DomandaUno-Q-PROBE")
    expect(html).toContain("DomandaDue-Q-PROBE")
    expect(html).toContain("RispostaUno-A-PROBE")
    expect(html).toContain("RispostaDue-A-PROBE")
    // None of the removed heading strings leak into the items-only render.
    expect(html).not.toContain("Eyebrow-HEAD-PROBE")
    expect(html).not.toContain("Titolo-HEAD-PROBE")
    expect(html).not.toContain("Sottotitolo-HEAD-PROBE")
    // No object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})
