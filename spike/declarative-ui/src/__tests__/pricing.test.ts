import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import type { A2uiTree } from "../a2ui/schema"

// Pricing pipeline/contract behavior tests (PLAN.md phase 35 t4) — TEST-AFTER (serialized on t2):
// these prove the REAL pipeline's handling of the marketing-tier Pricing declared as an A2UI tree,
// not new behavior. Every test uses the dynamic-import pattern (`await import("../pipeline")`)
// inside its async body — never a top-level static import — and references Pricing ONLY by the
// string `type: "Pricing"` (never a static symbol import of the component), matching
// `__tests__/feature-grid.test.ts` / `__tests__/hero.test.ts` so this file stays load-safe
// regardless of task execution order (ADR-018's dynamic-import pattern).
//
// The billing-toggle CLICK behavior is a BROWSER concern (t5), NOT this file: here we assert the
// CONTRACT + render + injection only.
//   C1 — a valid Pricing tree (an optional {it,en} heading + billing labels + 3 plans, EXACTLY one
//        highlighted, prices as plain currency strings) renders through the pipeline, check glyph
//        resolved.
//   C2/C4 — malformed Pricing trees (a plan missing priceAnnual / a name given as a bare string /
//        plans absent / plans not an array / a plan missing cta / a plan missing name / ZERO
//        highlighted / TWO highlighted) are each rejected by the pipeline's Zod pass with a NAMED
//        error, never rendered.
//   C3 — an HTML/script payload in a text prop (a feature line / a plan name) is rendered inert
//        (or rejected), never as a live <script>/<img onerror> node.
//   C4 — the heading fields are genuinely optional: a Pricing declared without them renders
//        plans-only.

// A well-formed, catalog-valid Pricing declaration (root node id "root", per the adapter's root
// convention). Distinctive probe strings avoid coincidental markup matches; no provider is mounted
// by the C1 render, so the i18n default ("it") resolves — the .it copy is what appears. The heading
// probes are DISTINCT from the plan probes so an absence check (C4) can't match by accident. The
// CENTER (non-first) plan is the single highlighted one, matching the two-view reorder anatomy.
const validPricingTree: A2uiTree = {
  nodes: [
    {
      id: "root",
      type: "Pricing",
      props: {
        eyebrow: { it: "Eyebrow-HEAD-PROBE", en: "Eyebrow-HEAD-PROBE-EN" },
        title: { it: "Titolo-HEAD-PROBE", en: "Title-HEAD-PROBE-EN" },
        subtitle: { it: "Sottotitolo-HEAD-PROBE", en: "Subtitle-HEAD-PROBE-EN" },
        billing: {
          monthlyLabel: { it: "Mensile-PROBE", en: "Monthly-PROBE" },
          annualLabel: { it: "Annuale-PROBE", en: "Annual-PROBE" },
          perMonth: { it: "/mese-PROBE", en: "/month-PROBE" },
          perYear: { it: "/anno-PROBE", en: "/year-PROBE" },
          annualNote: { it: "Nota-annuale-PROBE", en: "Annual-note-PROBE" },
          groupLabel: { it: "Ciclo-PROBE", en: "Cycle-PROBE" },
        },
        plans: [
          {
            name: { it: "PianoUno-NAME-PROBE", en: "PlanOne-NAME-PROBE-EN" },
            priceMonthly: "PRICE-A-MONTHLY-PROBE",
            priceAnnual: "PRICE-A-ANNUAL-PROBE",
            features: [{ it: "PianoUno-FEATURE-PROBE", en: "PlanOne-FEATURE-PROBE-EN" }],
            cta: {
              label: { it: "PianoUno-CTA-PROBE", en: "PlanOne-CTA-PROBE-EN" },
              href: "#one",
            },
            highlighted: false,
          },
          {
            name: { it: "PianoDue-NAME-PROBE", en: "PlanTwo-NAME-PROBE-EN" },
            priceMonthly: "PRICE-B-MONTHLY-PROBE",
            priceAnnual: "PRICE-B-ANNUAL-PROBE",
            description: { it: "PianoDue-DESC-PROBE", en: "PlanTwo-DESC-PROBE-EN" },
            features: [{ it: "PianoDue-FEATURE-PROBE", en: "PlanTwo-FEATURE-PROBE-EN" }],
            cta: {
              label: { it: "PianoDue-CTA-PROBE", en: "PlanTwo-CTA-PROBE-EN" },
              href: "#two",
            },
            highlighted: true,
            badge: { it: "PianoDue-BADGE-PROBE", en: "PlanTwo-BADGE-PROBE-EN" },
          },
          {
            name: { it: "PianoTre-NAME-PROBE", en: "PlanThree-NAME-PROBE-EN" },
            priceMonthly: "PRICE-C-MONTHLY-PROBE",
            priceAnnual: "PRICE-C-ANNUAL-PROBE",
            features: [{ it: "PianoTre-FEATURE-PROBE", en: "PlanThree-FEATURE-PROBE-EN" }],
            cta: {
              label: { it: "PianoTre-CTA-PROBE", en: "PlanThree-CTA-PROBE-EN" },
              href: "#three",
            },
            highlighted: false,
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

function pricingProps(tree: A2uiTree): Record<string, unknown> {
  const root = tree.nodes.find((node) => node.id === "root")
  if (!root) throw new Error("test tree missing root node")
  return root.props as Record<string, unknown>
}

function pricingPlans(tree: A2uiTree): Array<Record<string, unknown>> {
  return pricingProps(tree).plans as Array<Record<string, unknown>>
}

describe("renderConversation — renders a valid Pricing declaration (C1)", () => {
  it("exits and the static markup carries the heading, every plan's copy, a monthly price and a resolved glyph", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(validPricingTree))

    // The Pricing really mounted (its data-slot is in the DOM), not some fallback.
    expect(html).toContain('data-slot="pricing"')
    // The declared {it,en} heading copy resolves through the "it" default and appears as text.
    expect(html).toContain("Titolo-HEAD-PROBE")
    // Every plan's name resolves.
    expect(html).toContain("PianoUno-NAME-PROBE")
    expect(html).toContain("PianoDue-NAME-PROBE")
    expect(html).toContain("PianoTre-NAME-PROBE")
    // Every plan's feature line resolves.
    expect(html).toContain("PianoUno-FEATURE-PROBE")
    expect(html).toContain("PianoDue-FEATURE-PROBE")
    expect(html).toContain("PianoTre-FEATURE-PROBE")
    // Every plan's CTA label resolves.
    expect(html).toContain("PianoUno-CTA-PROBE")
    expect(html).toContain("PianoDue-CTA-PROBE")
    expect(html).toContain("PianoTre-CTA-PROBE")
    // The highlighted plan's badge renders.
    expect(html).toContain("PianoDue-BADGE-PROBE")
    // The default (monthly) billing state shows AT LEAST the monthly price of a plan.
    expect(html).toContain("PRICE-B-MONTHLY-PROBE")
    // The owned check glyph resolved to a REAL lucide inline <svg> beside the features (C3a).
    expect(html).toContain("<svg")
    // No {it,en} object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})

describe("renderConversation — rejects malformed Pricing props before rendering (C2/C4)", () => {
  it("throws InvalidComponentPropsError naming Pricing/priceAnnual when a plan omits its annual price", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validPricingTree)
    delete pricingPlans(tree)[0].priceAnnual

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Pricing")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Pricing")
    // The offending prop path (plans.0.priceAnnual) is named.
    expect(error.message).toContain("priceAnnual")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/FeatureGrid convention): a MISSING required field's Zod message legitimately
    // contains "undefined" (expected string, received undefined), so this case does NOT assert
    // against it.
  })

  it("throws InvalidComponentPropsError naming Pricing/name when a plan's name is a bare string", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validPricingTree)
    pricingPlans(tree)[0].name = "just a string, not {it,en}"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Pricing")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Pricing")
    expect(error.message).toContain("name")
    // A wrong-TYPE prop (object expected, string given) yields a clean message with no stray
    // interpolation placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming Pricing/name when a plan omits its name", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validPricingTree)
    delete pricingPlans(tree)[0].name

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Pricing")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Pricing")
    expect(error.message).toContain("name")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/FeatureGrid convention): `name` is required, so its missing-field Zod message
    // legitimately contains "undefined" — that word is not asserted against here.
  })

  it("throws InvalidComponentPropsError naming Pricing/cta when a plan omits its cta", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validPricingTree)
    delete pricingPlans(tree)[0].cta

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Pricing")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Pricing")
    expect(error.message).toContain("cta")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/FeatureGrid convention): `cta` is required, so its missing-field message
    // legitimately contains "undefined" — not asserted against here.
  })

  it("throws InvalidComponentPropsError naming Pricing/plans when plans is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validPricingTree)
    delete pricingProps(tree).plans

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Pricing")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Pricing")
    expect(error.message).toContain("plans")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Hero/FeatureGrid convention): `plans` is required, so its missing-field Zod message
    // legitimately contains "undefined" (expected array, received undefined) — not asserted here.
  })

  it("throws InvalidComponentPropsError naming Pricing/plans when plans is not an array", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validPricingTree)
    pricingProps(tree).plans = "not-an-array"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Pricing")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Pricing")
    expect(error.message).toContain("plans")
    // A wrong-TYPE prop (array expected, string given) yields a clean message with no placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming highlighted when ZERO plans are highlighted", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validPricingTree)
    for (const plan of pricingPlans(tree)) plan.highlighted = false

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Pricing")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Pricing")
    // The superRefine message names `highlighted` and the `plans` path (C4 exactly-one guarantee).
    expect(error.message).toContain("highlighted")
    expect(error.message).toContain("plans")
    expect(error.message).not.toContain("[object Object]")
  })

  it("throws InvalidComponentPropsError naming highlighted when TWO plans are highlighted", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validPricingTree)
    pricingPlans(tree)[0].highlighted = true
    pricingPlans(tree)[2].highlighted = true

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Pricing")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Pricing")
    // Both the too-many case and the zero case name `highlighted` via the superRefine message.
    expect(error.message).toContain("highlighted")
    expect(error.message).toContain("plans")
    expect(error.message).not.toContain("[object Object]")
  })
})

describe("renderConversation — Pricing never emits a live HTML/script payload (C3)", () => {
  it("escapes a <script> payload in a feature line (rejected or rendered inert, never live)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validPricingTree)
    const payload = "<script>alert(1)</script>"
    pricingPlans(tree)[0].features = [{ it: payload, en: payload }]

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

  it("escapes an <img src=x onerror=...> payload in a plan name (rejected or rendered inert)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validPricingTree)
    const payload = "<img src=x onerror=alert(1)>"
    pricingPlans(tree)[0].name = { it: payload, en: payload }

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

describe("renderConversation — Pricing heading fields are genuinely optional (C4)", () => {
  it("renders plans-only when eyebrow/title/subtitle are omitted: plan copy present, heading strings absent", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validPricingTree)
    delete pricingProps(tree).eyebrow
    delete pricingProps(tree).title
    delete pricingProps(tree).subtitle

    const html = renderToStaticMarkup(renderConversation(tree))

    // The Pricing rendered successfully with no heading fields (C4b).
    expect(html).toContain('data-slot="pricing"')
    // Every plan's copy still appears.
    expect(html).toContain("PianoUno-NAME-PROBE")
    expect(html).toContain("PianoDue-NAME-PROBE")
    expect(html).toContain("PianoTre-NAME-PROBE")
    expect(html).toContain("PianoUno-FEATURE-PROBE")
    // None of the removed heading strings leak into the plans-only render.
    expect(html).not.toContain("Eyebrow-HEAD-PROBE")
    expect(html).not.toContain("Titolo-HEAD-PROBE")
    expect(html).not.toContain("Sottotitolo-HEAD-PROBE")
    // No object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})
