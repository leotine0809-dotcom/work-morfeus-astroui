// conversation-item.test.tsx — RED-first (phase 53 t4): ConversationItem's bare-row presentation
// takes astrobot's exact row (ABOT-017: flex/gap-3.5/rounded-lg/px-3 py-3, `bg-accent` filled when
// selected else a lighter `hover:bg-accent/60`), rebuilt as a cva-shaped `<button>` (a `ref` must
// reach it — astrobot wraps the row in `ContextMenuTrigger asChild`, fleet.tsx t16) with the
// domain (channel/presence/group/hue/avatarSrc) gone: `avatar`/`meta` are slots, not schema
// fields. Dynamic imports (ADR-018) for consistency with every other astro-ui test this phase
// writes (PD-12), even though this task rewrites the export in place.
//
// No jsdom/testing-library in this package (environment: "node", PD-12) — structural assertions
// use `renderToStaticMarkup`; the click/ref wiring is checked by calling the forwardRef
// component's own `.render(props, ref)` directly (still no DOM, just the plain function call that
// produces the element React would otherwise mount).
import { createRef } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

describe("ConversationItem — the row (phase 53 t4)", () => {
  it("renders a <button data-slot='conversation-item'> with astrobot's row shape, filled when selected", async () => {
    const { ConversationItem } = await import("../conversation-item")

    const html = renderToStaticMarkup(<ConversationItem name="Mara Okafor" selected />)

    expect(html).toMatch(/^<button\b/)
    expect(html).toContain('data-slot="conversation-item"')
    const classMatch = html.match(/<button[^>]*class="([^"]*)"/)
    expect(classMatch).not.toBeNull()
    const classes = classMatch![1].split(" ")
    for (const cls of [
      "flex", "w-full", "items-center", "gap-3.5", "rounded-lg", "px-3", "py-3", "text-left", "transition-colors",
    ]) {
      expect(classes).toContain(cls)
    }
    expect(classes).toContain("bg-accent")
    expect(classes).not.toContain("hover:bg-accent/60")
  })

  it("falls back to hover:bg-accent/60 (never bg-accent) when not selected", async () => {
    const { ConversationItem } = await import("../conversation-item")

    const html = renderToStaticMarkup(<ConversationItem name="Mara Okafor" />)

    const classMatch = html.match(/<button[^>]*class="([^"]*)"/)
    const classes = classMatch![1].split(" ")
    expect(classes).toContain("hover:bg-accent/60")
    expect(classes).not.toContain("bg-accent")
  })

  it("renders the avatar slot inside a shrink-0 cell", async () => {
    const { ConversationItem } = await import("../conversation-item")

    const html = renderToStaticMarkup(
      <ConversationItem name="Mara Okafor" avatar={<span data-testid="av">A</span>} />,
    )

    expect(html).toContain('<div class="shrink-0"><span data-testid="av">A</span></div>')
  })

  it("renders the unread dot and bolds the title when unread", async () => {
    const { ConversationItem } = await import("../conversation-item")

    const html = renderToStaticMarkup(<ConversationItem name="Mara Okafor" unread={2} />)

    expect(html).toContain('<span class="size-1.5 shrink-0 rounded-full bg-primary">')
    expect(html).toContain("font-semibold")
  })

  it("renders the meta slot in the right cell", async () => {
    const { ConversationItem } = await import("../conversation-item")

    const html = renderToStaticMarkup(<ConversationItem name="Mara Okafor" meta={<span>09:20</span>} />)

    const metaMatch = html.match(/<span class="([^"]*)"><span>09:20<\/span><\/span>/)
    expect(metaMatch).not.toBeNull()
    expect(metaMatch![1]).toContain("text-[11px]")
    expect(metaMatch![1]).toContain("text-muted-foreground")
  })

  it("falls back to rendering the plain time string when no meta slot is given", async () => {
    const { ConversationItem } = await import("../conversation-item")

    const html = renderToStaticMarkup(<ConversationItem name="Mara Okafor" time="09:20" />)

    expect(html).toContain(">09:20<")
  })

  it("renders caption and preview at astrobot's sizes", async () => {
    const { ConversationItem } = await import("../conversation-item")

    const html = renderToStaticMarkup(
      <ConversationItem name="Mara Okafor" caption="WhatsApp" preview="See you at 6" />,
    )

    const captionMatch = html.match(/<div class="([^"]*)">WhatsApp<\/div>/)
    expect(captionMatch).not.toBeNull()
    expect(captionMatch![1]).toContain("text-[11px]")
    expect(captionMatch![1]).toContain("text-muted-foreground/80")

    expect(html).toContain("text-[13px]")
    expect(html).toContain("See you at 6")
  })

  it("lands previewColor as an inline color style on the preview line", async () => {
    const { ConversationItem } = await import("../conversation-item")

    const html = renderToStaticMarkup(
      <ConversationItem name="Mara Okafor" preview="See you at 6" previewColor="rgb(1,2,3)" />,
    )

    expect(html).toContain('style="color:rgb(1,2,3)"')
  })

  it("fires onSelect on click, and forwards a ref that reaches the button", async () => {
    const { ConversationItem } = await import("../conversation-item")

    const onSelect = vi.fn()
    const ref = createRef<HTMLButtonElement>()
    const render = (ConversationItem as unknown as { render: (props: unknown, ref: unknown) => any }).render
    const element = render({ name: "Mara Okafor", onSelect }, ref)

    expect(element.type).toBe("button")
    expect(element.ref).toBe(ref)
    element.props.onClick()
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})

// A ROW THAT IS WRAPPED MUST STAY REACHABLE.
//
// The regression this refuses, in the words of the thing that broke: astrobot's
// agent rows had a ten-item context menu — pin, important, mark unread, edit
// profile, duplicate, copy id, archive, DELETE — and it stopped opening the day
// the row became this component. Nothing threw. Radix's
// `ContextMenuTrigger asChild` clones its child and injects `onContextMenu`,
// `onPointerDown`, `data-state` and friends; the old local `<button>` absorbed
// them because a DOM node absorbs everything, and a component with a closed
// prop list silently dropped them. The owner's report was "agents do not have
// right click anymore" — with no error anywhere to explain it.
//
// So: whatever a wrapper injects reaches the root node. Declared props still
// win where they overlap (the row's own layout classes are not negotiable —
// an extra className is MERGED, never a replacement).
describe("ConversationItem — transparent to composition", () => {
  it("passes a wrapper's injected handlers and data attributes to the root button", async () => {
    const { ConversationItem } = await import("../conversation-item")
    const onContextMenu = vi.fn()

    // Exactly the shape ContextMenuTrigger asChild produces.
    const html = renderToStaticMarkup(
      <ConversationItem
        name="UI CAL"
        onContextMenu={onContextMenu}
        data-state="closed"
        aria-haspopup="menu"
        id="row-ui-cal"
      />,
    )

    expect(html).toContain('data-state="closed"')
    expect(html).toContain('aria-haspopup="menu"')
    expect(html).toContain('id="row-ui-cal"')
  })

  it("keeps its own row classes when a wrapper also passes className", async () => {
    const { ConversationItem } = await import("../conversation-item")

    const html = renderToStaticMarkup(<ConversationItem name="UI CAL" className="ring-2" />)
    const classes = html.match(/<button[^>]*class="([^"]*)"/)![1].split(" ")

    expect(classes).toContain("ring-2")
    // The geometry the library owns survives the merge — a wrapper may add, never replace.
    for (const cls of ["flex", "w-full", "gap-3.5", "rounded-lg"]) {
      expect(classes).toContain(cls)
    }
  })

  it("actually fires the injected handler", async () => {
    const { ConversationItem } = await import("../conversation-item")
    const onContextMenu = vi.fn()

    // No DOM in this package: call the forwardRef render directly and invoke the
    // prop the element carries, which is what React would dispatch to.
    const el = (ConversationItem as unknown as {
      render: (p: Record<string, unknown>, r: unknown) => { props: Record<string, unknown> }
    }).render({ name: "UI CAL", onContextMenu }, null)

    ;(el.props.onContextMenu as () => void)()
    expect(onContextMenu).toHaveBeenCalledTimes(1)
  })
})

// AND THE SAME TRAP FROM THE OTHER SIDE. Making the row transparent means a wrapper's `onClick`
// now arrives — and a naive spread would have let it REPLACE the row's own selection handler,
// trading a dead context menu for a dead row. Both run, unless the wrapper says otherwise.
describe("ConversationItem — a wrapper's click does not eat the row's own", () => {
  it("runs the wrapper's onClick and still selects", async () => {
    const { ConversationItem } = await import("../conversation-item")
    const wrapperClick = vi.fn()
    const onSelect = vi.fn()

    const el = (ConversationItem as unknown as {
      render: (p: Record<string, unknown>, r: unknown) => { props: Record<string, unknown> }
    }).render({ name: "UI CAL", onClick: wrapperClick, onSelect }, null)

    ;(el.props.onClick as (e: unknown) => void)({ defaultPrevented: false })
    expect(wrapperClick).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("lets the wrapper cancel selection by preventing the event", async () => {
    const { ConversationItem } = await import("../conversation-item")
    const onSelect = vi.fn()

    const el = (ConversationItem as unknown as {
      render: (p: Record<string, unknown>, r: unknown) => { props: Record<string, unknown> }
    }).render({ name: "UI CAL", onClick: () => {}, onSelect }, null)

    ;(el.props.onClick as (e: unknown) => void)({ defaultPrevented: true })
    expect(onSelect).not.toHaveBeenCalled()
  })
})
