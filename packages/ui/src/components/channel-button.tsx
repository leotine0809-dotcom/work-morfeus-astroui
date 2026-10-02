import { z } from "zod"

import { cn } from "../lib/utils"
import { CHANNEL_META, ChannelGlyph, type ChannelKey } from "./channels"

// ChannelButton — one icon in the left rail. Carries only the channel KEY (maps to its own glyph
// + label internally); `active` shows the accent state + edge indicator; `badge` is the unread
// count. `dataKey` -> `data-key` so the host wires channel filtering by event-delegation.
export const channelButtonPropsSchema = z.object({
  channelKey: z.enum(["all", "wa", "tg", "slack", "mail", "teams", "cu"]),
  badge: z.number().optional(),
  active: z.boolean().optional(),
  dataKey: z.string().optional(),
})

export type ChannelButtonProps = z.infer<typeof channelButtonPropsSchema>

function ChannelButton({ channelKey, badge, active = false, dataKey }: ChannelButtonProps) {
  return (
    <button
      type="button"
      data-slot="channel-button"
      data-key={dataKey}
      title={CHANNEL_META[channelKey].label}
      aria-pressed={active}
      className={cn(
        "relative grid size-[42px] flex-none place-items-center rounded-xl transition-colors",
        active
          ? "bg-[var(--acc-dim)] text-primary shadow-[inset_0_0_0_1px_var(--acc-line)]"
          : "text-muted-foreground hover:bg-white/[.06] hover:text-foreground"
      )}
    >
      <ChannelGlyph k={channelKey as ChannelKey} className="size-5" />
      {badge ? (
        <span className="absolute right-1.5 top-1.5 grid h-[15px] min-w-[15px] place-items-center rounded-lg bg-[var(--accent-solid)] px-1 font-mono text-[9px] font-semibold text-[var(--bubble-out-foreground)] shadow-[0_0_0_2px_var(--metal-ring)]">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

export { ChannelButton }
