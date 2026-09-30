// message-bubble.test.tsx — RED-first (phase 53 t3): MessageBubble takes astrobot's OUTER SHAPE
// (direction, max-width, radius, padding, colours — PD-8). Markdown, ask cards, tool rows,
// attachments and feedback stay in astrobot's chat.tsx as children; this component owns only the
// bubble itself. Dynamic imports (ADR-018) for consistency with every other astro-ui test this
// phase writes (PD-12), even though this task creates the export.
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("MessageBubble — the outer shape (phase 53 t3)", () => {
  it("direction=in renders the slot, the inbound fill and astrobot's shape classes", async () => {
    const { MessageBubble } = await import("../message-bubble")

    const html = renderToStaticMarkup(<MessageBubble direction="in" text="hi" />)

    expect(html).toContain('data-slot="message-bubble"')
    expect(html).toContain('data-direction="in"')
    expect(html).toContain("bg-[var(--bubble-in)]")
    expect(html).toContain("max-w-[78%]")
    expect(html).toContain("rounded-2xl")
    expect(html).toContain("px-3.5")
    expect(html).toContain("py-2.5")
    expect(html).toContain("text-sm")
    expect(html).toContain("leading-relaxed")
  })

  it("direction=out renders the outbound fill and foreground colour", async () => {
    const { MessageBubble } = await import("../message-bubble")

    const html = renderToStaticMarkup(<MessageBubble direction="out" text="hi" />)

    expect(html).toContain("bg-[var(--bubble-out)]")
    expect(html).toContain("text-[var(--bubble-out-foreground)]")
  })

  it("constrained={false} drops the max-width", async () => {
    const { MessageBubble } = await import("../message-bubble")

    const html = renderToStaticMarkup(<MessageBubble direction="in" text="hi" constrained={false} />)

    expect(html).not.toContain("max-w-[78%]")
  })

  it("forwards extra DOM props (data-turn-anchor, className) onto the element", async () => {
    const { MessageBubble } = await import("../message-bubble")

    const html = renderToStaticMarkup(
      <MessageBubble direction="in" text="hi" data-turn-anchor="t1" className="custom-flash" />,
    )

    expect(html).toContain('data-turn-anchor="t1"')
    expect(html).toContain("custom-flash")
  })

  it("renders children when given, instead of text through RichText", async () => {
    const { MessageBubble } = await import("../message-bubble")

    const html = renderToStaticMarkup(
      <MessageBubble direction="in" text="ignored">
        <b>explicit child</b>
      </MessageBubble>,
    )

    expect(html).toContain("explicit child")
    expect(html).not.toContain("ignored")
  })

  it("renders text through RichText when no children are given", async () => {
    const { MessageBubble } = await import("../message-bubble")

    const html = renderToStaticMarkup(<MessageBubble direction="in" text="hello world" />)

    expect(html).toContain("hello world")
  })
})
