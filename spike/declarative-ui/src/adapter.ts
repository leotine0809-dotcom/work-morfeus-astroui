import type { Spec, UIElement } from "@json-render/core"

import { a2uiTreeSchema, type A2uiTree } from "@/a2ui/schema"
import { ALLOWED_COMPONENT_TYPES } from "@/catalog"

// Adapter — simplified-A2UI tree -> json-render's flat { root, elements } Spec (PLAN.md t9).
// Per NOTES-A2UI.md's verified json-render contract, both shapes are already flat adjacency
// lists (A2UI's `nodes[]` array vs. json-render's `elements` map keyed by id) — this is a
// mechanical reshape, no tree-walking: id -> map key, type -> type, props -> props (already
// plain literal values, no A2UI BoundValue indirection), childrenIds -> children, and the node
// whose id === "root" becomes Spec.root (NOTES-A2UI.md's root convention).
//
// The allow-list (C3) is enforced HERE, not left to json-render's Renderer: any node whose
// `type` is outside ALLOWED_COMPONENT_TYPES throws a NAMED UnknownComponentTypeError identifying
// the offending type + node id, before the tree ever reaches the renderer — never a silent
// pass-through, and never an opaque error that doesn't name what was rejected.

/**
 * Thrown when an A2UI node declares a `type` outside `ALLOWED_COMPONENT_TYPES`. Named so a
 * caller (t10's pipeline, t13's reject tests) can identify exactly which type/node was rejected
 * without parsing a generic message.
 */
export class UnknownComponentTypeError extends Error {
  readonly type: string
  readonly nodeId: string

  constructor(type: string, nodeId: string) {
    super(
      `Unknown component type "${type}" on node "${nodeId}" is not in the allow-list: ` +
        `${ALLOWED_COMPONENT_TYPES.join(", ")}.`
    )
    this.name = "UnknownComponentTypeError"
    this.type = type
    this.nodeId = nodeId
  }
}

/**
 * Thrown when a validated A2UI tree has no node with `id === "root"` — fails loudly instead of
 * guessing a root from an arbitrary node.
 */
export class MissingRootNodeError extends Error {
  constructor(nodeIds: readonly string[]) {
    super(`A2UI tree has no node with id "root" (found: ${nodeIds.join(", ") || "none"}).`)
    this.name = "MissingRootNodeError"
  }
}

/**
 * Adapts a simplified-A2UI tree (`src/a2ui/schema.ts`) into json-render's flat `{ root, elements }`
 * Spec (`@json-render/react`'s `Renderer` input). Validates the input against the a2ui Zod schema
 * first (the adapter's own input boundary — independent of json-render's), then rejects any node
 * whose `type` is not catalog-allowed before it can reach the renderer.
 */
export function a2uiToJsonRender(input: unknown): Spec {
  const tree: A2uiTree = a2uiTreeSchema.parse(input)

  const elements: Record<string, UIElement> = {}
  for (const node of tree.nodes) {
    if (!ALLOWED_COMPONENT_TYPES.includes(node.type)) {
      throw new UnknownComponentTypeError(node.type, node.id)
    }
    elements[node.id] = {
      type: node.type,
      props: node.props,
      children: node.childrenIds,
    }
  }

  const root = tree.nodes.find((node) => node.id === "root")
  if (!root) {
    throw new MissingRootNodeError(tree.nodes.map((node) => node.id))
  }

  return { root: root.id, elements }
}
