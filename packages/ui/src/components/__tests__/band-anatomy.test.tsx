import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { Band } from "../band"
import { AccountRow } from "../account-row"

// HEIGHT IS NOT ANATOMY.
//
// The first shared Band carried only `h-[var(--app-header-h)]` and a border, and
// three apps at the same height still read as three different products: a small
// logo tight to the edge in one, a large one with other padding in the next.
// What has to be closed is WHICH slots exist, in what order, and how big.
describe("Band anatomy is closed", () => {
  it("puts lead, center and actions in that order, with the fixed action gap", () => {
    const html = renderToStaticMarkup(
      <Band lead={<span>brand</span>} center={<span>a title</span>} actions={<button>+</button>} />,
    )
    const lead = html.indexOf('data-slot="band-lead"')
    const center = html.indexOf('data-slot="band-center"')
    const actions = html.indexOf('data-slot="band-actions"')
    expect(lead).toBeGreaterThan(-1)
    expect(center).toBeGreaterThan(lead)
    expect(actions).toBeGreaterThan(center)
    // the action cluster's own gap is the library's, so two apps' action rows line up
    expect(html).toContain('data-slot="band-actions" class="flex shrink-0 items-center gap-1"')
    // and the title yields space rather than pushing the actions off
    expect(html).toContain('data-slot="band-center" class="min-w-0 flex-1 truncate"')
  })

  it("keeps astrobot's measured frame: height token, justify-between, gap-2, px-4", () => {
    const html = renderToStaticMarkup(<Band lead={<span>b</span>} />)
    for (const cls of ["h-[var(--app-header-h)]", "justify-between", "gap-2", "px-4", "border-b"]) {
      expect(html).toContain(cls)
    }
  })

  it("still renders one undivided row from children — the height-only adopters do not break", () => {
    const html = renderToStaticMarkup(<Band><span>just a row</span></Band>)
    expect(html).toContain("just a row")
    expect(html).not.toContain('data-slot="band-lead"')
    // no justify-between: an undivided row is not a three-cell layout
    expect(html).not.toContain("justify-between")
  })
})

// The same corner of three products, at three different sizes, for no reason.
describe("AccountRow is one size everywhere", () => {
  it("uses astrobot's measured avatar, type scale and padding", () => {
    const html = renderToStaticMarkup(<AccountRow initials="AC" name="Alex Carofiglio" />)
    expect(html).toContain("size-6")          // 24px circle — not 36, not 40
    expect(html).toContain("text-[11px]")     // the initials
    expect(html).toContain("truncate text-sm text-muted-foreground") // the name truncates
    expect(html).toContain("gap-2.5 rounded-lg px-2.5 py-2")
    expect(html).toContain("AC")
    expect(html).toContain("Alex Carofiglio")
  })

  it("takes a trailing cell beside the account, outside the control", () => {
    const html = renderToStaticMarkup(<AccountRow initials="A" name="Alex" trailing={<button>theme</button>} />)
    const control = html.indexOf('data-slot="account-control"')
    expect(html.indexOf("theme")).toBeGreaterThan(control)
  })
})
