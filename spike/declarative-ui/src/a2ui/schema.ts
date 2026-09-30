import { z } from "zod";

/**
 * Simplified A2UI-shaped tree — Zod v4 schema + inferred TS types.
 *
 * Reused as (a) the constraint handed to the LLM (`claude -p`, t12) and (b) the adapter's
 * (t9) input validation boundary before it reshapes this into json-render's `{ root, elements }`
 * flat spec. See NOTES-A2UI.md for the real A2UI wire shape (v0.8's `component: {Type: {...}}`
 * wrapper key + `BoundValue`, v1.0's `component: "Text"` discriminator string) and exactly how
 * and why this schema diverges from both for a one-shot static render (no streaming envelope,
 * no data-model binding, no catalog negotiation).
 */

/** A component's props: a plain JSON object of literal values (no `BoundValue`/`$state` binding). */
export const a2uiPropsSchema = z.record(z.string(), z.unknown());

/**
 * A single A2UI-shaped node. `type` is the catalog component name (matches v1.0's plain-string
 * discriminator). `childrenIds` are sibling node ids, following the adjacency-list model shared
 * by every real A2UI version — no nested/recursive shape.
 */
export const a2uiNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  props: a2uiPropsSchema.default({}),
  childrenIds: z.array(z.string().min(1)).optional(),
});

/**
 * A single-surface A2UI-shaped tree: a flat list of nodes. Per the real spec's convention, the
 * node whose `id` is `"root"` is the root of the tree (the adapter, t9, resolves it this way).
 */
export const a2uiTreeSchema = z.object({
  nodes: z.array(a2uiNodeSchema).min(1),
});

export type A2uiProps = z.infer<typeof a2uiPropsSchema>;
export type A2uiNode = z.infer<typeof a2uiNodeSchema>;
export type A2uiTree = z.infer<typeof a2uiTreeSchema>;
