// shell.test.tsx — RED-first (phase 53 t5): Shell reproduces astrobot's page.tsx DOM verbatim —
// the three-column desktop frame AND the phone back-stack — ResizeHandle carries
// `data-slot="resize-handle"`, and Band is the 60px header extracted into one component. Dynamic
// imports (ADR-018) — kept for consistency with every other astro-ui test this phase writes
// (PD-12), even though this task creates the exports.
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("Shell — the desktop frame (phase 53 t5)", () => {
  it("renders list, main, right in order inside the closed frame classes", async () => {
    const { Shell } = await import("../shell")

    const html = renderToStaticMarkup(
      <Shell
        list={<div id="list" />}
        main={<div id="main" />}
        right={<div id="right" />}
        leftWidth={300}
        onLeftResize={() => {}}
        onRightResize={() => {}}
      />,
    )

    expect(html).toContain("flex h-dvh w-full overflow-hidden bg-background")
    const listIdx = html.indexOf('id="list"')
    const mainIdx = html.indexOf('id="main"')
    const rightIdx = html.indexOf('id="right"')
    expect(listIdx).toBeGreaterThan(-1)
    expect(listIdx).toBeLessThan(mainIdx)
    expect(mainIdx).toBeLessThan(rightIdx)
  })

  it("sizes the left column from leftWidth", async () => {
    const { Shell } = await import("../shell")

    const html = renderToStaticMarkup(<Shell list={<div />} main={<div />} leftWidth={300} />)

    expect(html).toContain('style="width:300px"')
  })

  it("showIcon swaps in icon, sized at the one place that reads GEOMETRY.iconRailPx (92px)", async () => {
    const { Shell } = await import("../shell")

    const html = renderToStaticMarkup(
      <Shell list={<div id="list" />} icon={<div id="icon" />} showIcon leftWidth={300} main={<div />} />,
    )

    expect(html).toContain('style="width:92px"')
    expect(html).toContain('id="icon"')
    expect(html).not.toContain('id="list"')
  })

  it("the left handle appears only when onLeftResize is given and leftResizable !== false", async () => {
    const { Shell } = await import("../shell")

    const withHandle = renderToStaticMarkup(
      <Shell list={<div />} main={<div />} leftWidth={300} onLeftResize={() => {}} />,
    )
    expect(withHandle).toContain('data-slot="resize-handle"')

    const noCallback = renderToStaticMarkup(<Shell list={<div />} main={<div />} leftWidth={300} />)
    expect(noCallback).not.toContain('data-slot="resize-handle"')

    const forcedOff = renderToStaticMarkup(
      <Shell list={<div />} main={<div />} leftWidth={300} onLeftResize={() => {}} leftResizable={false} />,
    )
    expect(forcedOff).not.toContain('data-slot="resize-handle"')
  })

  it("the right handle appears only when right AND onRightResize are both given", async () => {
    const { Shell } = await import("../shell")

    const both = renderToStaticMarkup(
      <Shell
        list={<div />}
        main={<div />}
        leftWidth={300}
        right={<div id="right" />}
        onRightResize={() => {}}
      />,
    )
    expect(both.match(/data-slot="resize-handle"/g)).toHaveLength(1)

    const rightOnly = renderToStaticMarkup(
      <Shell list={<div />} main={<div />} leftWidth={300} right={<div id="right" />} />,
    )
    expect(rightOnly).not.toContain('data-slot="resize-handle"')

    const callbackOnly = renderToStaticMarkup(
      <Shell list={<div />} main={<div />} leftWidth={300} onRightResize={() => {}} />,
    )
    expect(callbackOnly).not.toContain('data-slot="resize-handle"')
  })
})

describe("Shell — the phone back-stack (phase 53 t5)", () => {
  it('narrow + mobilePane="list" renders ONLY list, no handle, no right', async () => {
    const { Shell } = await import("../shell")

    const html = renderToStaticMarkup(
      <Shell
        narrow
        mobilePane="list"
        list={<div id="list" />}
        main={<div id="main" />}
        right={<div id="right" />}
        leftWidth={300}
        onLeftResize={() => {}}
        onRightResize={() => {}}
      />,
    )

    expect(html).toContain("flex h-full w-full flex-col")
    expect(html).toContain('id="list"')
    expect(html).not.toContain('id="main"')
    expect(html).not.toContain('id="right"')
    expect(html).not.toContain('data-slot="resize-handle"')
  })

  it('narrow + mobilePane="main" renders ONLY main', async () => {
    const { Shell } = await import("../shell")

    const html = renderToStaticMarkup(
      <Shell narrow mobilePane="main" list={<div id="list" />} main={<div id="main" />} leftWidth={300} />,
    )

    expect(html).toContain('id="main"')
    expect(html).not.toContain('id="list"')
  })
})

describe("Shell — banner and children (phase 53 t5)", () => {
  it("renders banner before the frame and children after", async () => {
    const { Shell } = await import("../shell")

    const html = renderToStaticMarkup(
      <Shell list={<div />} main={<div />} leftWidth={300} banner={<div id="banner" />}>
        <div id="modal" />
      </Shell>,
    )

    const bannerIdx = html.indexOf('id="banner"')
    const frameIdx = html.indexOf("flex h-dvh w-full overflow-hidden bg-background")
    const modalIdx = html.indexOf('id="modal"')
    expect(bannerIdx).toBeGreaterThan(-1)
    expect(bannerIdx).toBeLessThan(frameIdx)
    expect(modalIdx).toBeGreaterThan(frameIdx)
  })
})

describe("Band — the 60px header (phase 53 t5)", () => {
  it("renders the closed band classes merged with className", async () => {
    const { Band } = await import("../band")

    const html = renderToStaticMarkup(<Band className="gap-3" />)

    expect(html).toContain('data-slot="band"')
    expect(html).toContain("flex h-[var(--app-header-h)] shrink-0 items-center border-b border-border px-4")
    expect(html).toContain("gap-3")
  })
})
