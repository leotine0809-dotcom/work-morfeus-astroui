import { z } from "zod"

import { cn } from "../lib/utils"

// ThreadMarker — ONE marker between messages, three kinds (redundancy pass: a date pill, an inline
// time, and a "message from X" divider are the SAME use — a thread marker — not three components):
//   • "date"  — a STICKY day pill (Today/Yesterday/date), holds at top while its day scrolls.
//   • "time"  — an INLINE cluster time (a >20-min lull), scrolls with its cluster.
//   • "label" — a centered rule + label marking a context break (thread start, exceptional sender).
// astrobot's two-marker date/time (chat.tsx:502-517) + its centered divider, unified.
export const threadMarkerPropsSchema = z.object({
  label: z.string(),
  kind: z.enum(["date", "time", "label"]),
})

export type ThreadMarkerProps = z.infer<typeof threadMarkerPropsSchema>

function ThreadMarker({ label, kind }: ThreadMarkerProps) {
  if (kind === "date") {
    return (
      <div
        data-slot="thread-marker"
        data-kind="date"
        className="sticky top-1 z-[5] my-1 self-center rounded-full border border-border/60 bg-card/85 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur"
      >
        {label}
      </div>
    )
  }
  if (kind === "label") {
    // astrobot's "Message from X" divider is a centered text span only — no side rules, no mono.
    return (
      <div data-slot="thread-marker" data-kind="label" className="my-2 self-center text-[11px] font-medium text-muted-foreground">
        {label}
      </div>
    )
  }
  return (
    <div data-slot="thread-marker" data-kind="time" className={cn("my-0.5 self-center text-[10px] font-medium tabular-nums text-muted-foreground")}>
      {label}
    </div>
  )
}

export { ThreadMarker }
