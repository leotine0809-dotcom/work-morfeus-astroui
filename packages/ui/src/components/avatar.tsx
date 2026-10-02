import * as React from "react"
import { z } from "zod"

import { cn } from "../lib/utils"
import { CHANNEL_META, ChannelGlyph, type ChannelKey } from "./channels"

/**
 * astrochat avatar — a generated initials-on-hue disc (NOT a mascot; agent mascots live outside
 * this catalog per CONTEXT.md), with an optional image, an optional channel corner-badge, and an
 * optional presence dot. Both the LLM's allowed prop vocabulary AND the runtime Zod boundary.
 */
export const avatarPropsSchema = z.object({
  alt: z.string(),
  src: z.string().optional(),
  fallback: z.string().optional(),
  hue: z.number().optional(),
  size: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
  channel: z.enum(["wa", "tg", "slack", "mail", "teams", "cu"]).optional(),
  presence: z.enum(["online", "away", "offline"]).optional(),
})

export type AvatarProps = z.infer<typeof avatarPropsSchema>

// scale aligned to astrobot's avatar sizes (agent-avatar 28/30/40/52/72; header uses 30, hero 72)
const SIZE = { xs: 30, sm: 40, md: 42, lg: 52, xl: 72 } as const
const FONT = { xs: 11, sm: 15, md: 15, lg: 18, xl: 26 } as const

// Best-available initials from the label. May be "" (a group name of only symbols, an empty alt) —
// callers MUST treat "" as "no initials" and fall back to a glyph, never render an empty tile.
function initialsOf(alt: string, fallback?: string) {
  if (fallback) return fallback
  return alt.replace(/^#/, "").split(/[\s-]+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
}

function Avatar({ alt, src, fallback, hue = 210, size = "md", channel, presence }: AvatarProps) {
  const px = SIZE[size]
  // An empty/broken `src` must never leave a blank <img>: onError reverts to initials/glyph (C6).
  const [imgFailed, setImgFailed] = React.useState(false)
  // A single Avatar node is reused across selections (the scheda hero never remounts), so a prior
  // 404 avatar would otherwise poison EVERY later src — leaving initials on a party whose image is
  // perfectly valid. Reset the failure flag whenever `src` changes so each image gets its own try.
  const [lastSrc, setLastSrc] = React.useState(src)
  if (src !== lastSrc) {
    setLastSrc(src)
    setImgFailed(false)
  }
  const showImg = Boolean(src) && !imgFailed
  const initials = initialsOf(alt, fallback)
  return (
    <span
      data-slot="avatar"
      className="relative inline-grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: px, height: px, fontSize: FONT[size],
        background: showImg ? undefined : `linear-gradient(145deg, hsl(${hue} 42% 44%), hsl(${hue} 46% 27%))`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.14)",
      }}
    >
      {showImg ? (
        <img src={src} alt={alt} onError={() => setImgFailed(true)} className="size-full rounded-full object-cover" />
      ) : initials ? (
        <span aria-hidden>{initials}</span>
      ) : (
        // No usable label → a channel-tinted brand disc (groups/unknowns), never an empty tile (C6).
        <ChannelGlyph k={(channel as ChannelKey) ?? "all"} className="h-[55%] w-[55%] text-white/90" />
      )}
      {channel && (
        <span
          className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full"
          // FLAT badge (no filled brand tile): a subtle panel disc carrying the channel's brand
          // GLYPH in its own tint — reads like the flat top-strip icons, not a heavy colour sticker.
          style={{ width: px * 0.46, height: px * 0.46, background: "var(--panel)", color: CHANNEL_META[channel].color, boxShadow: "0 0 0 1.5px var(--panel)" }}
        >
          <ChannelGlyph k={channel as ChannelKey} className={cn("h-[64%] w-[64%]")} />
        </span>
      )}
      {!channel && presence && (
        <span
          className="absolute bottom-0 right-0 rounded-full"
          style={{
            width: px * 0.28, height: px * 0.28,
            background: presence === "online" ? "var(--green)" : presence === "away" ? "var(--amber)" : "var(--faint)",
            boxShadow: "0 0 0 2.5px var(--panel)",
          }}
        />
      )}
    </span>
  )
}

export { Avatar }
