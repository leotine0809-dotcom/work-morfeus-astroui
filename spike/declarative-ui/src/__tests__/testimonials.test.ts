import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import type { A2uiTree } from "../a2ui/schema"

// Testimonials pipeline/contract behavior tests (PLAN.md phase 40 t6) — TEST-AFTER (serialized on
// t3): these prove the REAL pipeline's handling of the marketing-tier Testimonials declared as an
// A2UI tree, not new behavior. Every test uses the dynamic-import pattern (`await import("../pipeline")`)
// inside its async body — never a top-level static import — and references Testimonials ONLY by the
// string `type: "Testimonials"` (never a static symbol import of the component), matching
// `__tests__/footer.test.ts` / `__tests__/pricing.test.ts` so this file stays load-safe regardless
// of task execution order (ADR-018's dynamic-import pattern).
//
// The narrow scroll-snap CAROUSEL scroll behavior and the @container two-view are a BROWSER concern
// (t5), NOT this file: here we assert the CONTRACT + render + injection only. The render probe uses
// `renderToStaticMarkup`, so the single-container view is present in static markup and every declared
// string appears: assert `toContain`, never layout counts.
//   C1/C3a — a valid full-anatomy tree (heading eyebrow/title/subtitle, items each with
//        quote + author.name + role, one item with an avatar.src, one initials-only, ratings present)
//        renders via the pipeline: the testimonials slot, each quote / author name (plain) / role /
//        heading part, the avatar src <img> with its {it,en} alt, a resolved lucide star <svg>, no
//        [object Object].
//   C2/C3c — malformed Testimonials trees (items absent / items not an array / items empty [].min(1) /
//        an item missing quote / a quote given as a bare string / an item missing author /
//        author.name absent / author.role a bare string) are each rejected by the pipeline's Zod pass
//        with a NAMED error, never rendered.
//   C4 — rating is an OPTIONAL integer 1..5: 5 and 1 render that many star <svg>; 0, 6, and 2.5 are
//        each a contract error.
//   C5 — a declared avatar.src emits an <img> carrying its {it,en} alt; an item without an avatar
//        emits NO <img> for that author and the author's initials instead, no empty/missing-src <img>.
//   C7 — an HTML/script payload in a text prop (quote / author.name / role) is rejected with a named
//        error OR rendered inert (escaped), never a live <script>/<img onerror> node.
//   C3b — a Testimonials with the heading, avatar, and rating all omitted renders the quote + author
//        name + role, none of the omitted content (no star <svg>, no <img>) leaking.

// A well-formed, catalog-valid Testimonials declaration (root node id "root", per the adapter's root
// convention). Distinctive probe strings avoid coincidental markup matches; no provider is mounted by
// the C1 render, so the i18n default ("it") resolves — the .it copy is what appears. Item 0 carries an
// avatar.src (an <img> path, C5); item 1 has NO avatar (initials fallback, C5) and item 2 omits its
// rating (C3 optional). The author names are plain (untranslated) strings.
const validTestimonialsTree: A2uiTree = {
  nodes: [
    {
      id: "root",
      type: "Testimonials",
      props: {
        eyebrow: { it: "Eyebrow-HEAD-PROBE", en: "Eyebrow-HEAD-PROBE-EN" },
        title: { it: "Titolo-HEAD-PROBE", en: "Title-HEAD-PROBE-EN" },
        subtitle: { it: "Sottotitolo-HEAD-PROBE", en: "Subtitle-HEAD-PROBE-EN" },
        ratingLabel: { it: "{n} su 5", en: "{n} out of 5" },
        items: [
          {
            quote: { it: "Citazione-Q1-PROBE", en: "Quote-Q1-PROBE-EN" },
            author: {
              name: "Fabio Denuzzo",
              role: { it: "Fondatore-R1-PROBE", en: "Founder-R1-PROBE-EN" },
            },
            avatar: {
              src: "https://example.test/avatar-a1-probe.png",
              alt: { it: "Ritratto-ALT1-PROBE", en: "Portrait-ALT1-PROBE-EN" },
            },
            rating: 5,
          },
          {
            quote: { it: "Citazione-Q2-PROBE", en: "Quote-Q2-PROBE-EN" },
            author: {
              name: "Marco Rossi",
              role: { it: "Progettista-R2-PROBE", en: "Designer-R2-PROBE-EN" },
            },
            rating: 3,
          },
          {
            quote: { it: "Citazione-Q3-PROBE", en: "Quote-Q3-PROBE-EN" },
            author: {
              name: "Anna Bianchi",
              role: { it: "Sviluppatrice-R3-PROBE", en: "Developer-R3-PROBE-EN" },
            },
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

function testimonialsProps(tree: A2uiTree): Record<string, unknown> {
  const root = tree.nodes.find((node) => node.id === "root")
  if (!root) throw new Error("test tree missing root node")
  return root.props as Record<string, unknown>
}

function testimonialsItems(tree: A2uiTree): Array<Record<string, unknown>> {
  return testimonialsProps(tree).items as Array<Record<string, unknown>>
}

function testimonialsAuthor(tree: A2uiTree, i: number): Record<string, unknown> {
  return testimonialsItems(tree)[i].author as Record<string, unknown>
}

// The star name-token is the ONLY icon Testimonials resolves, so every inline lucide <svg> in the
// markup is a rating star: counting `<svg` occurrences counts the rendered stars (C4).
function countSvg(html: string): number {
  return (html.match(/<svg/g) || []).length
}

// A single-item Testimonials at a given rating, so the star count is unambiguous (C4).
function oneItemAtRating(rating: unknown): A2uiTree {
  return {
    nodes: [
      {
        id: "root",
        type: "Testimonials",
        props: {
          items: [
            {
              quote: { it: "Citazione-RATE-PROBE", en: "Quote-RATE-PROBE-EN" },
              author: {
                name: "Rita Verdi",
                role: { it: "Cliente-PROBE", en: "Customer-PROBE" },
              },
              rating,
            },
          ],
        },
      },
    ],
  }
}

describe("renderConversation — renders a valid Testimonials declaration (C1/C3a)", () => {
  it("exits and the static markup carries the testimonials slot, the heading, every quote/name/role, the avatar <img> + alt and a resolved star glyph", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(validTestimonialsTree))

    // The Testimonials really mounted (its data-slot is in the DOM), not some fallback.
    expect(html).toContain('data-slot="testimonials"')
    // The declared {it,en} heading parts resolve through the "it" default and appear as text.
    expect(html).toContain("Eyebrow-HEAD-PROBE")
    expect(html).toContain("Titolo-HEAD-PROBE")
    expect(html).toContain("Sottotitolo-HEAD-PROBE")
    // Every item's quote resolves.
    expect(html).toContain("Citazione-Q1-PROBE")
    expect(html).toContain("Citazione-Q2-PROBE")
    expect(html).toContain("Citazione-Q3-PROBE")
    // Every author name renders as the PLAIN string (unchanged by language).
    expect(html).toContain("Fabio Denuzzo")
    expect(html).toContain("Marco Rossi")
    expect(html).toContain("Anna Bianchi")
    // Every author role resolves via {it,en}.
    expect(html).toContain("Fondatore-R1-PROBE")
    expect(html).toContain("Progettista-R2-PROBE")
    expect(html).toContain("Sviluppatrice-R3-PROBE")
    // Item 0's declared avatar.src produced a real <img> carrying its {it,en} alt (C5).
    expect(html).toContain('src="https://example.test/avatar-a1-probe.png"')
    expect(html).toContain('alt="Ritratto-ALT1-PROBE"')
    // The owned star glyph resolved to a REAL lucide inline <svg> (C6).
    expect(html).toContain("<svg")
    // No {it,en} object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})

describe("renderConversation — rejects malformed Testimonials props before rendering (C2/C3c)", () => {
  it("throws InvalidComponentPropsError naming Testimonials/items when items is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    delete testimonialsProps(tree).items

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("items")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (Footer/Pricing convention): `items` is required, so its missing-field Zod message
    // legitimately contains "undefined" (expected array, received undefined) — not asserted here.
  })

  it("throws InvalidComponentPropsError naming Testimonials/items when items is not an array", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    testimonialsProps(tree).items = "not-an-array"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("items")
    // A wrong-TYPE prop (array expected, string given) yields a clean message with no placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming Testimonials/items when items is empty (the .min(1) guard)", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    testimonialsProps(tree).items = []

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    // An empty items array is a contract error (the schema requires .min(1)), never rendered.
    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("items")
    expect(error.message).not.toContain("[object Object]")
  })

  it("throws InvalidComponentPropsError naming Testimonials/quote when an item omits its quote", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    delete testimonialsItems(tree)[0].quote

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("quote")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (convention): `quote` is required, so its missing-field message legitimately contains
    // "undefined" (expected object, received undefined) — not asserted against here.
  })

  it("throws InvalidComponentPropsError naming Testimonials/quote when a quote is a bare string", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    testimonialsItems(tree)[0].quote = "just a string, not {it,en}"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("quote")
    // A wrong-TYPE prop (object expected, string given) yields a clean message with no placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming Testimonials/author when an item omits its author", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    delete testimonialsItems(tree)[0].author

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("author")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (convention): `author` is required, so its missing-field message legitimately contains
    // "undefined" (expected object, received undefined) — not asserted against here.
  })

  it("throws InvalidComponentPropsError naming Testimonials/name when author.name is missing", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    delete testimonialsAuthor(tree, 0).name

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("name")
    expect(error.message).not.toContain("[object Object]")
    // NOTE (convention): `author.name` is required, so its missing-field message legitimately contains
    // "undefined" (expected string, received undefined) — not asserted against here.
  })

  it("throws InvalidComponentPropsError naming Testimonials/role when author.role is a bare string", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    testimonialsAuthor(tree, 0).role = "just a string, not {it,en}"

    let caught: unknown
    try {
      renderConversation(tree)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("role")
    // A wrong-TYPE prop (object expected, string given) yields a clean message with no placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })
})

describe("renderConversation — rating is an optional integer 1..5 (C4)", () => {
  it("renders exactly 5 star <svg> for a rating of 5", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(oneItemAtRating(5)))

    expect(html).toContain('data-slot="testimonials"')
    expect(html).toContain('data-slot="testimonial-rating"')
    // The only icon Testimonials renders is the star: 5 stars -> 5 inline <svg>.
    expect(countSvg(html)).toBe(5)
    expect(html).not.toContain("[object Object]")
  })

  it("renders exactly 1 star <svg> for a rating of 1", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(oneItemAtRating(1)))

    expect(html).toContain('data-slot="testimonial-rating"')
    expect(countSvg(html)).toBe(1)
    expect(html).not.toContain("[object Object]")
  })

  it("throws InvalidComponentPropsError naming Testimonials/rating when rating is 0", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    let caught: unknown
    try {
      renderConversation(oneItemAtRating(0))
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("rating")
    // An out-of-range value (below the min) yields a clean message with no stray placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming Testimonials/rating when rating is 6", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    let caught: unknown
    try {
      renderConversation(oneItemAtRating(6))
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("rating")
    // An out-of-range value (above the max) yields a clean message with no stray placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })

  it("throws InvalidComponentPropsError naming Testimonials/rating when rating is a non-integer (2.5)", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    let caught: unknown
    try {
      renderConversation(oneItemAtRating(2.5))
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("Testimonials")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("Testimonials")
    expect(error.message).toContain("rating")
    // A non-integer (fails .int()) yields a clean message with no stray placeholders.
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })
})

describe("renderConversation — avatar is an image with an initials fallback (C5)", () => {
  it("emits an <img> with the {it,en} alt for a declared src, and initials (no <img>) for an item without an avatar", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(validTestimonialsTree))

    // Item 0 declared an avatar.src -> a real <img> carrying its resolved {it,en} alt.
    expect(html).toContain('src="https://example.test/avatar-a1-probe.png"')
    expect(html).toContain('alt="Ritratto-ALT1-PROBE"')
    // Item 1 declared NO avatar -> its author's initials ("Marco Rossi" -> "MR"), never an <img>.
    expect(html).toContain(">MR<")
    // Item 2 also has no avatar -> "Anna Bianchi" -> "AB".
    expect(html).toContain(">AB<")
    // Exactly ONE <img> in the whole render (only item 0 has a src); no empty/missing-src <img>.
    expect((html.match(/<img/g) || []).length).toBe(1)
    expect(html).not.toContain("<img src=\"\"")
    expect(html).not.toContain("[object Object]")
  })
})

describe("renderConversation — Testimonials never emits a live HTML/script payload (C7)", () => {
  it("escapes a <script> payload in a quote (rejected or rendered inert, never live)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    const payload = "<script>alert(1)</script>"
    testimonialsItems(tree)[0].quote = { it: payload, en: payload }

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

  it("escapes an <img src=x onerror=...> payload in the author name (rejected or rendered inert)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    const payload = "<img src=x onerror=alert(1)>"
    testimonialsAuthor(tree, 0).name = payload

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

  it("escapes a <script> payload in an author role (rejected or rendered inert)", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    const payload = "<script>alert(document.cookie)</script>"
    testimonialsAuthor(tree, 0).role = { it: payload, en: payload }

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

describe("renderConversation — Testimonials heading/avatar/rating are genuinely optional (C3b)", () => {
  it("renders quote + author name + role only when the heading, avatar and rating are all omitted: none of the omitted content leaks", async () => {
    const { renderConversation } = await import("../pipeline")

    const tree = clone(validTestimonialsTree)
    delete testimonialsProps(tree).eyebrow
    delete testimonialsProps(tree).title
    delete testimonialsProps(tree).subtitle
    delete testimonialsProps(tree).ratingLabel
    for (const item of testimonialsItems(tree)) {
      delete item.avatar
      delete item.rating
    }

    const html = renderToStaticMarkup(renderConversation(tree))

    // The Testimonials rendered successfully with only the required fields (C3b).
    expect(html).toContain('data-slot="testimonials"')
    // Every item's quote / author name / role still appears.
    expect(html).toContain("Citazione-Q1-PROBE")
    expect(html).toContain("Fabio Denuzzo")
    expect(html).toContain("Fondatore-R1-PROBE")
    expect(html).toContain("Citazione-Q3-PROBE")
    expect(html).toContain("Anna Bianchi")
    // None of the removed heading strings leak into the items-only render.
    expect(html).not.toContain("Eyebrow-HEAD-PROBE")
    expect(html).not.toContain("Titolo-HEAD-PROBE")
    expect(html).not.toContain("Sottotitolo-HEAD-PROBE")
    // No avatar declared -> no <img> anywhere; no rating declared -> no star <svg> and no rating group.
    expect(html).not.toContain("<img")
    expect(html).not.toContain("<svg")
    expect(html).not.toContain('data-slot="testimonial-rating"')
    // No object ever leaks as a placeholder.
    expect(html).not.toContain("[object Object]")
  })
})
