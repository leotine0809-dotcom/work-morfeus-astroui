// The refusal API (PD-5, phase 53) — `assertNoGlobalOverride` is a CSS-DECLARATION check: it
// tokenizes `--name:` at the START of a declaration (right after `{`, `;`, or whitespace/line
// start) and throws when `name` is in `CLOSED_TOKENS`. It never matches a `var(--name)` USAGE,
// which is always preceded by `(`, not a declaration boundary.
//
// Its limit is declared, not hidden: a runtime `style.setProperty("--app-header-h", …)` is
// invisible to a static text scan. That is recorded as the accepted limit in t18 — the pixel
// harness (C1/C2) is the runtime half this cannot see.
import { CLOSED_TOKENS } from "./source"

const CLOSED = new Set<string>(CLOSED_TOKENS)

// A DECLARATION start: `--name` immediately preceded by `{`, `;`, or whitespace/line-start, and
// immediately followed (ignoring whitespace) by `:`. `var(--name)` never matches — the character
// before `--name` there is `(`, which this pattern does not accept.
const DECLARATION = /(?:^|[{;\s])(--[a-zA-Z0-9-]+)\s*:/g

export class GlobalTokenOverrideError extends Error {
  constructor(
    public readonly token: string,
    public readonly file: string,
    public readonly line: number,
  ) {
    super(
      `${file}:${line}: "${token}" is a GLOBAL token (geometry/rhythm) owned by @astro/ui — an ` +
        `app may not redeclare it. See ADR-039 / phase 53 PD-2.`,
    )
    this.name = "GlobalTokenOverrideError"
  }
}

/** Throws `GlobalTokenOverrideError` (naming the token, `label`, and the 1-based line) the first
 *  time `css` DECLARES a CLOSED token. Runs on each app's own stylesheets — never on `@astro/ui`'s
 *  own generated `tokens.css`, which is where the closed set is legitimately declared. */
export function assertNoGlobalOverride(css: string, label: string): void {
  const lines = css.split(/\r\n|\r|\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    DECLARATION.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = DECLARATION.exec(line)) !== null) {
      const name = match[1]
      if (CLOSED.has(name)) throw new GlobalTokenOverrideError(name, label, i + 1)
    }
  }
}
