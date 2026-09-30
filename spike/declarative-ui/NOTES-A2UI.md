# NOTES — A2UI spec vs. this spike's simplified schema

Research for phase 31 t6, done against the real `a2ui-project/a2ui` GitHub repo (the spec moved
org from `google/A2UI` to `a2ui-project/a2ui`; `google/A2UI` now redirects there).

## What the real A2UI spec actually looks like

The repo carries **four** specification snapshots: `v0_8` (closed, no longer under active
development), `v0_9`, `v0_9_1`, and `v1_0` (the current "Candidate" spec, `protocolVersion:
"1.0"`, last updated 2026-06-08). They are **not** the same shape — v1.0 changed the wire format
significantly from v0.8. Both matter here: v0.8 is what the phase's CONTEXT.md/PLAN.md pointed at
before this task ran, v1.0 is what a fresh `claude -p` today would actually know about/emit if
asked to "speak A2UI" unprompted.

### v0.8 shape (closed, historical)

Streamed as JSONL over SSE. A `surfaceUpdate` message carries a `components` array; each component
is `{ id, component: { <TypeName>: { ...props } } }` — the **type name is a wrapper key**, not a
`type` string field. Example (from `specification/v0_8/docs/a2ui_protocol.md`):

```jsonl
{"surfaceUpdate": {"components": [{"id": "root", "component": {"Column": {"children": {"explicitList": ["profile_card"]}}}}]}}
{"surfaceUpdate": {"components": [{"id": "avatar", "component": {"Image": {"url": {"literalString": "https://www.example.com/profile.jpg"}}}}]}}
{"dataModelUpdate": {"contents": {}}}
{"beginRendering": {"root": "root"}}
```

Key v0.8 mechanics:
- **`BoundValue`**: any prop value is `{ "literalString": "..." }` (or `literalNumber`/
  `literalBoolean`) for a static value, or `{ "path": "/some/pointer" }` to bind against the
  data model — never a bare JSON primitive.
- **`children.explicitList`**: a container's children are `{ "children": { "explicitList": [ids] } }`
  (there's also a template/repeat form for data-bound lists), not a bare array.
- Four message types stream over JSONL/SSE: `surfaceUpdate`, `dataModelUpdate`, `beginRendering`
  (explicit "you now have enough to do the first paint" signal — prevents flash-of-incomplete-UI),
  `deleteSurface`. Client->server events (button clicks etc.) go back over a *separate* A2A
  message, keeping the UI stream unidirectional.

### v1.0 shape (current candidate — what actually changed)

v1.0 flattened the wrapper: `component` is now a **plain string discriminator**
(`"component": "Text"`, sibling of `id`/`props`), matching a JSON-Schema `oneOf` +
`discriminator: { propertyName: "component" }` pattern instead of a `{ Type: {...} }` object key.
Example (`specification/v1_0/docs/a2ui_protocol.md`):

```json
{"id": "root", "component": "Column", "children": ["title", "button"]}
{"id": "title", "component": "Text", "text": "Welcome"}
```

Other v1.0 changes that matter for "what a live A2UI-aware LLM might emit": messages are wrapped
`{ "version": "v1.0", "createSurface": {...} }` / `updateComponents` (renamed from
`surfaceUpdate`) / `updateDataModel` / `deleteSurface`, plus new bidirectional
`callRendererFunction`/`callAgentFunction` messages; a component tree can now be embedded directly
in `createSurface` (single-message instantiation) instead of requiring the
`surfaceUpdate`-then-`beginRendering` dance; `DynamicString`/`DynamicNumber`/`DynamicBoolean`
replace `BoundValue.literalString` etc., still `{ path: "/json/pointer" }` for data binding;
children are still ID references (`ChildList` = a static `array` of `ComponentId`s, or an
`object` template bound to a data-model array path) — the adjacency-list model (flat components,
tree rebuilt by ID lookup, one node with `id: "root"`) is unchanged from v0.8 through v1.0.

## Our chosen divergence (pre-authorized by CONTEXT.md)

Both real shapes above are built for **streaming, stateful, data-bound** UIs (JSONL/SSE deltas,
a separate data model, two-way binding, functions/validation, catalog negotiation). This spike
needs a **one-shot static render** of a single `claude -p` JSON response — no stream, no
`dataModel`/binding indirection, no `beginRendering` handshake. Re-implementing the full envelope
+ `BoundValue`/`DynamicString` + `ChildList` template machinery would be solving a problem this
spike doesn't have (ADR-001's spike-scope call, C1's bar is just "an A2UI-**shaped** tree").

So `src/a2ui/schema.ts` defines a **simplified single-tree, single-surface A2UI-shaped schema**:

```ts
{ nodes: [ { id, type, props, childrenIds? }, ... ] }
```

Divergences from the real spec, named explicitly:
- **`type` is a plain string field** (v1.0's shape, not v0.8's `{ Type: {...} }` wrapper key) —
  simpler for both a Zod discriminator-free schema and for prompting an LLM.
- **`props` is a plain JSON object of literal values** — no `BoundValue`/`DynamicString`/
  `{ path }` binding wrapper. There is no data model in this spike (C4's "invalid prop" test is
  about a literal value failing a component's Zod schema, not a binding failing to resolve).
- **`childrenIds` is a bare `string[]`** (renamed from A2UI's `children`, to read unambiguously
  as "array of sibling ids" next to json-render's own `children` field, which the adapter maps
  it onto — see below) — no `explicitList`/template wrapper, no repeat-over-data-model form.
- **No streaming envelope** (`surfaceUpdate`/`createSurface`/`updateComponents`/`beginRendering`/
  `deleteSurface`) — the whole tree arrives as one parsed JSON value from one `claude -p` call.
- **No `catalogId`/catalog-negotiation, no `functions`/`checks`/validation, no `action`/event
  wiring** — out of scope per CONTEXT.md (the spike's Composer send button doesn't need to round
  -trip an event to the agent).
- **Root selection**: kept the real spec's convention — the node whose `id === "root"` is the
  root (t9's adapter "picks a root" this way), so this still reads as "A2UI-shaped" rather than
  inventing a new field.

## json-render's actual input contract (verified in its own README, not assumed)

`@json-render/react`'s `Renderer` consumes a **flat, ID-keyed spec**, confirmed in
`node_modules/@json-render/react/README.md` and `node_modules/@json-render/core/README.md`:

```typescript
interface Spec {
  root: string;                          // key of the root element
  elements: Record<string, UIElement>;   // flat map, keyed by element id
  state?: Record<string, unknown>;
}
interface UIElement {
  type: string;              // component name from the catalog
  props: Record<string, unknown>;
  children?: string[];       // keys of child elements
  slots?: Record<string, string[]>;
  visible?: VisibilityCondition;
}
```

So the adapter's job (t9) is a small, mostly mechanical reshape: A2UI's flat `nodes[]` array
becomes json-render's flat `elements` **map** (keyed by `id`), `type`→`type`, `props`→`props`
verbatim, `childrenIds`→`children` (both are already plain `string[]` of sibling ids — no
tree-walking needed), and `root` is the id of the node found with `id === "root"`. No adapter-side
recursion is required; both formats are already flat adjacency lists, just with different field
names and array-vs-map framing for the node collection.

**No Vercel/Next-runtime/SSR coupling** — confirmed by reading both packages' READMEs end to end:
`Renderer`, `StateProvider`, `ActionProvider`, etc. are plain React components/hooks with no
`next/*` import, no server-action wiring, no RSC boundary; the quick-start examples are generic
`function App(){ return <Renderer .../> }`, which is exactly what this spike's Vite + React 19
app already is (t1). `@json-render/core` is framework-agnostic (schema/catalog/prompt-generation
utilities only); `@json-render/react` is the only renderer package pulled in, and its own docs
list sibling renderer packages (`@json-render/react-native`, `@json-render/react-pdf`) as proof
the React package itself carries no web/Next-specific assumption beyond "React".
