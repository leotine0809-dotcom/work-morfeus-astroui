// composer.test.tsx — RED-first (phase 53 t2): the Composer takes astrobot's exact frame (rounded
// card, autosizing textarea, the closed footer anatomy `[attach] … [dictate][send]`). Dynamic
// imports (ADR-018) even though this IS the task creating the export, kept for consistency with
// every other astro-ui test this phase writes (PD-12).
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("Composer — the frame (phase 53 t2)", () => {
  it("renders the slot, one send action, and the three labels as aria-labels", async () => {
    const { Composer } = await import("../composer")

    const html = renderToStaticMarkup(
      <Composer placeholder="x" labels={{ attach: "A", dictate: "D", send: "S" }} />,
    )

    expect(html).toContain('data-slot="composer"')
    expect(html.match(/data-action="send"/g)).toHaveLength(1)
    expect(html).toContain('aria-label="A"')
    expect(html).toContain('aria-label="D"')
    expect(html).toContain('aria-label="S"')
  })

  it("carries opacity-60 when disabled", async () => {
    const { Composer } = await import("../composer")

    const html = renderToStaticMarkup(<Composer placeholder="x" disabled />)

    expect(html).toContain("opacity-60")
  })

  it("renders a custom attach slot in place of the default attach button", async () => {
    const { Composer } = await import("../composer")

    const html = renderToStaticMarkup(<Composer placeholder="x" attach={<b>custom</b>} />)

    expect(html).toContain(">custom<")
    expect(html).not.toContain('data-action="attach"')
  })
})
