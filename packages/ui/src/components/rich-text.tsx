import { Fragment, type ReactNode } from "react"
import { z } from "zod"

// RichText — reworked from Hermes `thread/Linkify.tsx` into an astro catalog component. Turns a
// plain string into rich nodes: markdown links `[label](url)` + bare URLs → links, and
// `@[Name]`/`@<number>` → accent mention chips. Fully declarable (a pure function of `text` — the
// cleanest AG-UI node, no callbacks). `trust: "peer"` renders links INERT (no href) — the
// untrusted-sender safety both Hermes and astrobot carry (a peer/agent message must not ship a live
// link). Colours come from astro-ui tokens (accent-as-TEXT = `--accent-ink`, per the contrast gate),
// never the `--accent`/`color-mix` literals the source implementation used.
export const richTextPropsSchema = z.object({
  text: z.string(),
  trust: z.enum(["full", "peer"]).optional(),
})

export type RichTextProps = z.infer<typeof richTextPropsSchema>

const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s<>"')\]]+)/g
const MENTION_RE = /@\[([^\]\n]+)\]|@\d{5,}/g

function mentionify(chunk: string, keyBase: number): ReactNode[] {
  const parts: ReactNode[] = []
  let last = 0
  let k = 0
  let mo: RegExpExecArray | null
  MENTION_RE.lastIndex = 0
  while ((mo = MENTION_RE.exec(chunk)) !== null) {
    if (mo.index > last) parts.push(chunk.slice(last, mo.index))
    const label = mo[1] ?? mo[0].slice(1) // marked name, else the bare number
    parts.push(
      <span
        key={`m${keyBase}-${k++}`}
        className="mx-px inline-flex items-baseline rounded-md border border-[var(--acc-line)] bg-[var(--acc-dim)] px-1.5 text-[12px] font-semibold text-[var(--accent-ink)]"
      >
        @{label}
      </span>,
    )
    last = MENTION_RE.lastIndex
  }
  if (last < chunk.length) parts.push(chunk.slice(last))
  return parts
}

function RichText({ text, trust = "full" }: RichTextProps) {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  let mo: RegExpExecArray | null
  LINK_RE.lastIndex = 0
  while ((mo = LINK_RE.exec(text)) !== null) {
    if (mo.index > last) out.push(<Fragment key={`t${i}`}>{mentionify(text.slice(last, mo.index), i)}</Fragment>)
    const href = mo[2] || mo[3] // markdown url, else the bare url
    const label = mo[1] || mo[3] // markdown label, else the url itself
    out.push(
      trust === "peer" ? (
        // untrusted sender: show the link text, but it is NOT clickable
        <span key={i++} className="break-all text-[var(--accent-ink)] underline decoration-dotted underline-offset-2 opacity-80">
          {label}
        </span>
      ) : (
        <a key={i++} href={href} target="_blank" rel="noopener noreferrer" className="break-all text-[var(--accent-ink)] underline underline-offset-2">
          {label}
        </a>
      ),
    )
    last = LINK_RE.lastIndex
  }
  if (last < text.length) out.push(<Fragment key={`t${i}-end`}>{mentionify(text.slice(last), i + 1000)}</Fragment>)
  return (
    <div data-slot="rich-text" className="whitespace-pre-wrap break-words">
      {out}
    </div>
  )
}

export { RichText }
