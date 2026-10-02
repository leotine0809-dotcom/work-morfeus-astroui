// primitives.test.tsx — RED-first (phase 53 t15): `@astro/ui/primitives` is the shadcn floor
// copied byte-for-byte from astrobot's console/components/ui/{select,switch,textarea}.tsx (only
// the `@/lib/utils` import path changes). Dynamic import (ADR-018) — the module does not exist
// yet at RED time.
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

describe("@astro/ui/primitives — the shadcn floor (phase 53 t15)", () => {
  it("Textarea renders data-slot=\"textarea\"", async () => {
    const { Textarea } = await import("../../primitives")

    const html = renderToStaticMarkup(<Textarea placeholder="say something" />)

    expect(html).toContain('data-slot="textarea"')
  })

  it("Switch renders data-slot=\"switch\"", async () => {
    const { Switch } = await import("../../primitives")

    const html = renderToStaticMarkup(<Switch />)

    expect(html).toContain('data-slot="switch"')
  })

  it("Select's trigger renders data-slot=\"select-trigger\"", async () => {
    const { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } = await import(
      "../../primitives"
    )

    const html = renderToStaticMarkup(
      <Select value="a" onValueChange={() => {}}>
        <SelectTrigger>
          <SelectValue placeholder="pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    )

    expect(html).toContain('data-slot="select-trigger"')
  })
})
