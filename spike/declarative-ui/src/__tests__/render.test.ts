import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import type { A2uiTree } from "../a2ui/schema"
import conversationFixtureJson from "../../examples/fixtures/conversation.a2ui.json"

const conversationFixture = conversationFixtureJson as A2uiTree

// Render probe (remediation, phase 31 remediate-c0) — proves C2/C5 against the REAL pipeline,
// not adapter-only unit assertions: feeds a committed A2UI tree (root ConversationItem whose
// childrenIds point at 5 MessageBubbles + 1 Composer, mirroring what `npm run generate`'s live
// `claude -p` output actually shapes, per NOTES-A2UI.md's root convention) through
// `renderConversation` and inspects the produced static HTML. Uses the dynamic-import pattern
// (ADR-018) so this file stays load-safe regardless of task/remediation execution order.
//
// C2 requires ALL FOUR comms primitives to compose into one conversation from a single declared
// tree: before this fix, json-render's Renderer only mounts a node's children if the registry
// component function forwards + renders json-render's `children` render-prop — `registry.ts`
// discarded it for every entry, so only the root `ConversationItem` ever reached the DOM (see
// `evidence/EVIDENCE.md`'s C2/C5 findings). C5 (dark accent distinguishing inbound/outbound
// bubbles) was consequently unverifiable, since no MessageBubble ever rendered.
//
// phase 53 t4: ConversationItem's conversation-view header no longer synthesizes an Avatar of its
// own — `avatar` is a slot the caller composes (PD-8/D5, domain does not travel), and an A2UI tree
// carries JSON props only, never a ReactNode, so the declarative path here has no way to supply
// one. The fixture's header genuinely renders with no avatar now; C2's "all four primitives"
// count moves to Avatar's own contract/lab coverage rather than this JSON-only probe.

describe("renderConversation — composes the full conversation (C2, C5)", () => {
  it("renders ConversationItem, inbound+outbound MessageBubbles, and Composer together", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(conversationFixture))

    const conversationItemCount = (html.match(/data-slot="conversation-item"/g) ?? []).length
    const messageBubbleCount = (html.match(/data-slot="message-bubble"/g) ?? []).length
    const inboundCount = (html.match(/data-direction="in"/g) ?? []).length
    const outboundCount = (html.match(/data-direction="out"/g) ?? []).length
    const textareaCount = (html.match(/<textarea\b/g) ?? []).length

    expect(conversationItemCount).toBe(1)
    expect(messageBubbleCount).toBe(5)
    expect(inboundCount).toBeGreaterThanOrEqual(1)
    expect(outboundCount).toBeGreaterThanOrEqual(1)
    expect(textareaCount).toBe(1)
  })

  it("declared props drive the output: changing a message's text changes what renders", async () => {
    const { renderConversation } = await import("../pipeline")

    const changed: A2uiTree = JSON.parse(JSON.stringify(conversationFixture))
    const target = changed.nodes.find((node) => node.id === "msg-1")
    if (!target) throw new Error("fixture missing msg-1")
    target.props = { ...target.props, text: "CHANGED-TEXT-PROBE" }

    const html = renderToStaticMarkup(renderConversation(changed))
    expect(html).toContain("CHANGED-TEXT-PROBE")
  })

  it("gives the outbound (yours) bubble a distinct token from the inbound bubble (C5)", async () => {
    const { renderConversation } = await import("../pipeline")

    const html = renderToStaticMarkup(renderConversation(conversationFixture))

    // phase 53 t3: MessageBubble is now a single cva-shaped element (data-slot, data-direction and
    // the colour classes all live on the SAME div — PLAN.md t3's own RED spec), not a positioning
    // wrapper around a coloured child, so the fill classes sit on the tag carrying data-direction.
    const outMatch = html.match(/data-direction="out"[^>]*class="([^"]*)"/)
    const inMatch = html.match(/data-direction="in"[^>]*class="([^"]*)"/)

    expect(outMatch).not.toBeNull()
    expect(inMatch).not.toBeNull()
    expect(outMatch?.[1]).toContain("bg-[var(--bubble-out)]")
    expect(inMatch?.[1]).toContain("bg-[var(--bubble-in)]")
    expect(outMatch?.[1]).not.toBe(inMatch?.[1])
  })
})
