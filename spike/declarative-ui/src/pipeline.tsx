import * as React from "react"
import { Renderer, JSONUIProvider } from "@json-render/react"
import type { Spec } from "@json-render/core"
import type { ZodTypeAny, ZodError } from "zod"

import { a2uiToJsonRender } from "@/adapter"
import { catalog } from "@/catalog"
import { registry } from "@/registry"

// Pipeline (PLAN.md t10) — the ONE headless function used by both the app (t11) and the reject
// tests (t13): the adapter (t9) reshapes + allow-lists a simplified-A2UI tree into json-render's
// flat Spec (C1, C3), THIS file Zod-validates every element's props before anything renders (C4),
// then the validated spec is handed to json-render's <Renderer> bound to the real shadcn
// component registry (t8, C2).
//
// Why per-element validation lives HERE and not as `catalog.validate(spec)`: json-render 0.20's
// generic `props: propsOf("catalog.components")` schema type only resolves to a single
// component's real Zod schema when the catalog declares exactly ONE component. With our four
// (Avatar/MessageBubble/ConversationItem/Composer) `getPropsFromPath` collects all four schemas
// and — since there's more than one — falls back to `z.record(z.string(), z.unknown())`, i.e.
// `catalog.validate()` silently accepts ANY props shape for a multi-component catalog. So this
// file looks up each element's OWN Zod schema by its `type` (via `catalog.data.components`, the
// exact map handed to `defineCatalog` in t7) and validates it directly — the only path that
// actually enforces C4 here.
const componentSchemas = catalog.data.components as unknown as Record<
  string,
  { props: ZodTypeAny }
>

/**
 * Thrown when an element's props fail its own component's Zod schema. Named (mirrors
 * `UnknownComponentTypeError`/`MissingRootNodeError` in `adapter.ts`) so a caller can identify
 * exactly which component/node/prop was rejected. Always thrown BEFORE `<Renderer>` is handed the
 * spec — no partial/garbage DOM for the bad node ever reaches the screen (C4).
 */
export class InvalidComponentPropsError extends Error {
  readonly type: string
  readonly nodeId: string
  readonly issues: ZodError["issues"]

  constructor(type: string, nodeId: string, zodError: ZodError) {
    const detail = zodError.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ")
    super(`Invalid props for "${type}" on node "${nodeId}": ${detail}.`)
    this.name = "InvalidComponentPropsError"
    this.type = type
    this.nodeId = nodeId
    this.issues = zodError.issues
  }
}

/**
 * Validates every element's `props` against its own component's Zod schema (see the file
 * comment for why `catalog.validate(spec)` can't be used here). Throws `InvalidComponentPropsError`
 * naming the first offending component/node/prop; does nothing on success.
 */
function validateElementProps(spec: Spec): void {
  for (const [nodeId, element] of Object.entries(spec.elements)) {
    const definition = componentSchemas[element.type]
    // Unreachable in practice: `a2uiToJsonRender` (t9) already rejects any node whose `type`
    // is outside the allow-list, which is exactly `componentSchemas`'s key set. Guarded anyway
    // so this function never throws a confusing "cannot read property of undefined".
    if (!definition) continue

    const result = definition.props.safeParse(element.props)
    if (!result.success) {
      throw new InvalidComponentPropsError(element.type, nodeId, result.error)
    }
  }
}

/**
 * The full declarative-UI pipeline as ONE headless function: a simplified-A2UI tree in, a
 * mounted `<Renderer>` React element out. Runs the adapter (t9 — A2UI schema validation + the
 * named allow-list reject, C1/C3), then this file's per-element Zod validation (C4), then hands
 * the validated spec to json-render's `<Renderer>` bound to the real shadcn registry (t8, C2).
 * Throws — never returns a partial tree — on any of those three failures, so callers (the app,
 * t11; the reject tests, t13) can assert rejection without ever mounting bad output.
 */
export function renderConversation(a2uiTree: unknown): React.ReactElement {
  const spec = a2uiToJsonRender(a2uiTree)
  validateElementProps(spec)

  return (
    <JSONUIProvider registry={registry}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  )
}

/**
 * JSX entry point over `renderConversation` — what the app (t11) mounts under the dark wrapper.
 */
export function Conversation({ tree }: { tree: unknown }): React.ReactElement {
  return renderConversation(tree)
}
