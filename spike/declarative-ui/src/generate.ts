/// <reference types="node" />
/**
 * generate.ts — the live pipeline entry (PLAN.md t12): builds a prompt from the catalog's
 * vocabulary (allowed component names + their Zod-derived JSON-Schema shapes, t7) and calls the
 * Claude Code CLI in print mode (`claude -p`) to produce a simplified-A2UI tree (src/a2ui/schema.ts,
 * t6). LLM transport is ADR-002: the machine's own `claude` CLI/subscription, never
 * `@anthropic-ai/sdk` / `ANTHROPIC_API_KEY`.
 *
 * Windows gotcha: this machine's `claude` has no `.exe` on PATH — npm installs a `claude.cmd`
 * batch shim there (the real `claude.exe` sits nested inside the npm-global claude-code package,
 * not on PATH by name). The known failure mode is a MULTI-LINE `-p "<prompt>"` argv getting
 * mangled by that shim — the same bug astrobot's Go `claudecli` adapter hit and fixed the same way
 * this file does: never put the prompt on argv, always on stdin (a byte stream, immune to
 * shim/argv parsing) — verified against a real `claude.cmd` invocation on this machine, stdin
 * passthrough works fine, so resolving an `.exe` path is unnecessary once the prompt travels this
 * way.
 *
 * We own the structured-output guarantee (the CLI has no `zodOutputFormat`): the prompt demands
 * ONLY JSON, any ```json fences are stripped defensively, then the result is JSON.parsed and
 * validated against `a2uiTreeSchema` — a parse/validation failure throws, never a silent bad tree.
 * An empty/whitespace stdout means the CLI ran unauthenticated (prints nothing) — treated as an
 * auth error and thrown loudly, never mistaken for "no UI to render" (llm-transport-error-sentinel).
 */
import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { z } from "zod"

import { ALLOWED_COMPONENT_TYPES, catalog } from "./catalog"
import { a2uiTreeSchema, type A2uiTree } from "./a2ui/schema"

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** Gitignored per PLAN.md t12/t14 — the captured live output, not a fixture. */
const OUTPUT_PATH = path.join(HERE, "..", "examples", "conversation.a2ui.json")

/** Default brief handed to the LLM when the caller doesn't supply one. */
const DEFAULT_BRIEF =
  "A short astrochat-style direct-message conversation between the viewer and one other " +
  "person: a conversation list header for the thread, at least two inbound and two outbound " +
  "message bubbles with a natural back-and-forth, and the message composer at the bottom."

/** One catalog entry's vocabulary line: name, description, JSON-Schema-derived prop shape — read
 *  straight off the same Zod schema the runtime validates against (t7's catalog), never a
 *  hand-duplicated description that could drift from it. */
function describeComponent(name: string): string {
  const entry = (
    catalog.data.components as Record<string, { props: z.ZodTypeAny; description: string }>
  )[name]
  const jsonSchema = z.toJSONSchema(entry.props)
  return `### ${name}\n${entry.description}\nProps JSON Schema:\n${JSON.stringify(jsonSchema, null, 2)}`
}

/**
 * Builds the full prompt handed to `claude -p`: the catalog vocabulary (t7's allow-list, each
 * component's Zod-derived JSON Schema) + the exact simplified-A2UI wire shape (t6) + a worked
 * example, ending in the conversation brief. Kept in ONE function so the prompt and the schema it
 * targets can never silently drift apart — every constraint here is read off
 * `ALLOWED_COMPONENT_TYPES` and `a2uiTreeSchema`'s own shape, never hand-duplicated elsewhere.
 */
export function buildPrompt(brief: string = DEFAULT_BRIEF): string {
  const vocabulary = ALLOWED_COMPONENT_TYPES.map(describeComponent).join("\n\n")
  return `You output ONLY a single valid JSON value. No prose, no explanation, no markdown code
fences — the raw JSON object and nothing else, because your output is parsed programmatically.

You are declaring a UI as a simplified A2UI-shaped tree for a design system to render. The JSON
value MUST match this exact shape:

{
  "nodes": [
    { "id": "root", "type": "<ComponentName>", "props": { ... }, "childrenIds": ["<id>", ...] },
    { "id": "<id>", "type": "<ComponentName>", "props": { ... } }
  ]
}

Rules:
1. "nodes" is a flat array — every node in the tree, never nested.
2. Exactly one node has "id": "root" — the entry point.
3. "type" MUST be one of the AVAILABLE COMPONENTS below. Any other type is REJECTED, never rendered.
4. "props" MUST satisfy that component's JSON Schema below (right types, every required field present).
5. "childrenIds" (optional) lists the "id" of every child node, in the order they should render.
   Every id referenced by a "childrenIds" array MUST exist as its own node in "nodes".
6. Every node needs a unique "id".

AVAILABLE COMPONENTS (the ENTIRE allowed vocabulary — use nothing else):

${vocabulary}

Worked example (illustrative shape only — invent your own ids/content):
{"nodes":[{"id":"root","type":"ConversationItem","props":{"name":"Jamie Rivera","channel":"WhatsApp","preview":"See you at 6"},"childrenIds":["msg-1","msg-2","composer-1"]},{"id":"msg-1","type":"MessageBubble","props":{"text":"Hey, still on for tonight?","direction":"in"}},{"id":"msg-2","type":"MessageBubble","props":{"text":"Yes! See you at 6","direction":"out"}},{"id":"composer-1","type":"Composer","props":{"placeholder":"Message Jamie"}}]}

Now declare the tree for this conversation:
${brief}`
}

/** Strips a leading/trailing ```json / ``` fence the CLI sometimes wraps its JSON output in
 *  despite being told not to — defensive per PLAN.md t12, never trust the CLI's format promise. */
export function stripJsonFences(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenced ? fenced[1].trim() : trimmed
}

/**
 * Parses + validates one `claude -p` reply against the simplified-A2UI schema (t6). Throws a
 * descriptive error on invalid JSON, on a Zod validation failure (naming every offending path), or
 * when no node carries "id": "root" — we own this guarantee end to end, the CLI has no
 * structured-output mode to lean on.
 */
export function parseA2uiTree(raw: string): A2uiTree {
  const stripped = stripJsonFences(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(stripped)
  } catch (err) {
    throw new Error(
      `generate: claude -p did not return valid JSON: ${(err as Error).message}\n---\n${stripped.slice(0, 2000)}`
    )
  }

  const result = a2uiTreeSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(`generate: A2UI tree failed schema validation:\n${z.prettifyError(result.error)}`)
  }

  if (!result.data.nodes.some((node) => node.id === "root")) {
    throw new Error('generate: A2UI tree has no node with "id": "root"')
  }

  return result.data
}

/**
 * Runs `claude -p` with `prompt` on stdin, resolving with trimmed stdout. Fails loudly (rejects)
 * when the binary is missing (ENOENT/spawn error), exits non-zero, or prints empty/whitespace
 * stdout — an unauthenticated `claude -p` prints nothing, which would otherwise look identical to
 * "the model declared an empty UI" (llm-transport-error-sentinel).
 */
export function runClaudePrint(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // This machine's `claude` has no `.exe` on PATH — npm installs a `claude.cmd` batch shim
    // there. Node's own spawn (shell: false) refuses to launch a bare `.cmd` directly
    // (`spawn EINVAL` on this Node version); `shell: true` is what lets it resolve/run the shim.
    // The command is passed as ONE string (never an args array) under shell:true so there is
    // nothing for the shell to (mis)escape — the prompt itself never touches argv, it goes on
    // stdin below, so this is safe despite the shell hop.
    const isWindows = process.platform === "win32"
    const command = isWindows ? "claude.cmd -p" : "claude"
    const args = isWindows ? [] : ["-p"]

    const child = spawn(command, args, { shell: isWindows, stdio: ["pipe", "pipe", "pipe"] })

    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk))
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk))

    child.on("error", (err) => {
      reject(
        new Error(`generate: could not launch the claude CLI (is it installed/on PATH?): ${err.message}`)
      )
    })

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`generate: claude -p exited ${code}${stderr.trim() ? `: ${stderr.trim()}` : ""}`))
        return
      }
      const trimmed = stdout.trim()
      if (!trimmed) {
        reject(
          new Error(
            "generate: claude -p returned empty output — this is what an UNAUTHENTICATED CLI " +
              "prints (never a valid empty UI). Run `claude login` (or check CLAUDE_CONFIG_DIR) and retry."
          )
        )
        return
      }
      resolve(trimmed)
    })

    child.stdin.write(prompt)
    child.stdin.end()
  })
}

/**
 * The live pipeline entry: builds the catalog-derived prompt, calls the real `claude -p`, and
 * returns a validated simplified-A2UI tree (t6's schema). This is the one function the CLI runner
 * below — and any future caller (t11's app, t14's live proof run) — should use, never a
 * hand-rolled spawn elsewhere.
 */
export async function generateA2uiTree(brief?: string): Promise<A2uiTree> {
  const prompt = buildPrompt(brief)
  const raw = await runClaudePrint(prompt)
  return parseA2uiTree(raw)
}

/** CLI entry (`npm run generate`): calls the real CLI and writes the tree to
 *  `examples/conversation.a2ui.json` (gitignored) so the inner render loop (t11) iterates without
 *  re-calling `claude -p` on every reload. */
async function main() {
  const tree = await generateA2uiTree()
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, JSON.stringify(tree, null, 2) + "\n", "utf8")
  console.log(`generate: wrote ${tree.nodes.length} node(s) to ${OUTPUT_PATH}`)
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
}
