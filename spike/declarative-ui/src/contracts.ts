/// <reference types="node" />
/**
 * contracts — generate the MECHANICAL half of each component's contract from its Zod schema, and
 * (in --check) fail the build if a committed contract has drifted from the types. This is the #1
 * reliability move: the contracts are the whole value of a design system and rot first when written
 * by hand, so the props/variants/states half is GENERATED from the single source of truth (the Zod
 * schema each component already ships). The a11y / forbidden-uses / examples / `stable` half stays
 * HAND-WRITTEN in the same file and is NEVER regenerated — the CI compares only `$generated`.
 *
 *   tsx src/contracts.ts          → write/update every contracts/<Name>.contract.json (keeps manual keys)
 *   tsx src/contracts.ts --check  → CI: recompute, diff `$generated`, exit 1 on any drift or missing file
 */
import { z } from "zod"
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { catalog } from "./catalog"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(HERE, "..", "contracts")
const CHECK = process.argv.includes("--check")

type Manual = { a11y: string[]; forbidden: string[]; examples: unknown[]; stable: boolean }
const EMPTY_MANUAL: Manual = { a11y: [], forbidden: [], examples: [], stable: false }

// the mechanical contract — read straight off the Zod schema the runtime validates against
function generatedFor(name: string) {
  const entry = (catalog.data.components as Record<string, { props: z.ZodTypeAny; description: string }>)[name]
  return { description: entry.description, props: z.toJSONSchema(entry.props) }
}

const names: string[] = [...catalog.componentNames].sort()
const drift: string[] = []
const wrote: string[] = []

if (!CHECK) mkdirSync(OUT, { recursive: true })

for (const name of names) {
  const gen = generatedFor(name)
  const file = path.join(OUT, `${name}.contract.json`)
  let manual: Manual = { ...EMPTY_MANUAL }
  let committed: unknown = null
  if (existsSync(file)) {
    const cur = JSON.parse(readFileSync(file, "utf8"))
    committed = cur.$generated
    manual = { a11y: cur.a11y ?? [], forbidden: cur.forbidden ?? [], examples: cur.examples ?? [], stable: cur.stable ?? false }
  }
  if (CHECK) {
    if (!existsSync(file)) drift.push(`${name}: no contract file (run \`npm run contracts\`)`)
    else if (JSON.stringify(committed) !== JSON.stringify(gen)) drift.push(`${name}: $generated drifted from the Zod schema`)
  } else {
    const next = { component: name, $generated: gen, ...manual }
    writeFileSync(file, JSON.stringify(next, null, 2) + "\n")
    wrote.push(name)
  }
}

// a contract file for a component that no longer exists is also drift (in --check)
if (CHECK && existsSync(OUT)) {
  const known = new Set(names.map((n) => `${n}.contract.json`))
  for (const f of readdirSync(OUT)) {
    if (f.endsWith(".contract.json") && !known.has(f)) drift.push(`${f}: contract for a component no longer in the catalog`)
  }
}

console.log("\n  astro-ui · CONTRACT GATE (types → contract)\n")
if (CHECK) {
  if (drift.length) {
    console.log("  ✗ DRIFT — the committed contract disagrees with the Zod schema:\n")
    for (const d of drift) console.log(`    • ${d}`)
    console.log("\n  Fix: run `npm run contracts` and commit the updated contracts/.\n")
    process.exit(1)
  }
  console.log(`    ✓ all ${names.length} contracts agree with their component's Zod schema\n`)
} else {
  console.log(`    wrote ${wrote.length} contracts → contracts/ (mechanical half from Zod; a11y/forbidden/examples/stable kept)\n`)
}
