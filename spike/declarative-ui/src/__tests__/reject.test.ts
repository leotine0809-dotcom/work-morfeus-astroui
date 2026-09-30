import { describe, expect, it } from "vitest"

import unknownComponentFixture from "../../examples/fixtures/unknown-component.a2ui.json"
import invalidPropFixture from "../../examples/fixtures/invalid-prop.a2ui.json"

// Reject tests (PLAN.md t13) — TEST-AFTER (serialized on t10): these prove the REAL
// adapter/pipeline's existing rejection behaviour, not new behaviour, on two hand-written
// fixtures. Both are fed through the SAME `renderConversation` path the app (t11) uses, via a
// dynamic import inside each async test body (never a top-level static import) so this file
// stays load-safe regardless of task execution order (ADR-018's dynamic-import pattern).
//
// unknown-component.a2ui.json: a valid ConversationItem root whose childrenIds points at a node
// declaring `type: "EvilWidget"` — outside the catalog's allow-list (C3).
// invalid-prop.a2ui.json: a valid, catalog-allowed MessageBubble whose `text` prop is a number
// instead of a string — fails its own Zod schema (C4).

describe("renderConversation — reject unknown component types (C3)", () => {
  it("throws UnknownComponentTypeError naming the offending type and node, never rendering it", async () => {
    const { renderConversation } = await import("../pipeline")
    const { UnknownComponentTypeError } = await import("../adapter")

    let caught: unknown
    try {
      renderConversation(unknownComponentFixture)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(UnknownComponentTypeError)
    const error = caught as InstanceType<typeof UnknownComponentTypeError>
    expect(error.type).toBe("EvilWidget")
    expect(error.nodeId).toBe("intruder")
    expect(error.message).toContain("EvilWidget")
    expect(error.message).toContain("intruder")
  })
})

describe("renderConversation — reject invalid component props (C4)", () => {
  it("throws InvalidComponentPropsError identifying the component/prop, before any render", async () => {
    const { renderConversation } = await import("../pipeline")
    const { InvalidComponentPropsError } = await import("../pipeline")

    let caught: unknown
    try {
      renderConversation(invalidPropFixture)
    } catch (error) {
      caught = error
    }

    expect(caught).toBeInstanceOf(InvalidComponentPropsError)
    const error = caught as InstanceType<typeof InvalidComponentPropsError>
    expect(error.type).toBe("MessageBubble")
    expect(error.nodeId).toBe("root")
    expect(error.message).toContain("MessageBubble")
    expect(error.message).toContain("text")
    expect(error.message).not.toContain("[object Object]")
    expect(error.message).not.toContain("undefined")
  })
})
