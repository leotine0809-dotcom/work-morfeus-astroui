import { z } from "zod"

import { cn } from "../lib/utils"
import { CHANNEL_META, ChannelGlyph, type ChannelKey } from "./channels"

// Chip — ONE pill, for every "small labelled tag" use (redundancy pass: topic chips, channel
// chips, entity-ref chips and `Tag` were the SAME use, not separate components — extend one).
// tone "accent" = topic/label; a channelKey adds the channel colour dot (reachable-on); `open`
// makes it a link (a ref); `inert` = a ref with no destination (shown, not clickable). A strip of
// chips is just a Stack(row) of these — no separate `RefChips` component.
export const chipPropsSchema = z.object({
  label: z.string(),
  tone: z.enum(["neutral", "accent"]).optional(),
  channelKey: z.enum(["wa", "tg", "slack", "mail", "teams", "cu"]).optional(),
  open: z.string().optional(),
  inert: z.boolean().optional(),
  dataKey: z.string().optional(),
})

export type ChipProps = z.infer<typeof chipPropsSchema>

function Chip({ label, tone = "neutral", channelKey, open, inert, dataKey }: ChipProps) {
  const cls = cn(
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-medium",
    tone === "accent"
      ? "bg-[var(--acc-dim)] text-[var(--accent-ink)]"
      : "border border-border bg-[var(--card)] text-foreground",
    open && !inert && "hover:underline",
  )
  const inner = (
    <>
      {channelKey && (
        <span className="grid size-4 place-items-center rounded-full" style={{ background: CHANNEL_META[channelKey].color }}>
          <ChannelGlyph k={channelKey as ChannelKey} className="size-[9px] text-[var(--channel-ink)]" />
        </span>
      )}
      {label}
    </>
  )
  if (open && !inert) {
    return (
      <a data-slot="chip" href={open} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    )
  }
  return (
    <span data-slot="chip" data-key={dataKey} className={cls}>
      {inner}
    </span>
  )
}

export { Chip }
