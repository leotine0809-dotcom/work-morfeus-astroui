import type { ElementType, ReactNode } from "react"
import { cn } from "../lib/utils"

// AccountRow — who you are, at the foot of the rail.
//
// Every app had its own: different avatar size, different type scale, different
// padding, and one of them a noticeably larger circle than the rest. Nothing was
// wrong with any of them individually; together they made the same corner of
// three products look unrelated.
//
// Normalised on astrobot's, measured: a 24px initials circle in the accent at
// 20% with 11px semibold type, a 14px muted name that truncates, the row itself
// `gap-2.5 rounded-lg px-2.5 py-2`, and a trailing cell for whatever sits beside
// the account (astrobot puts the light/dark toggle there).
//
// An app that has no account row simply does not render one — this normalises
// the ones that exist, it does not mandate the surface.
export interface AccountRowProps {
  /** Initials shown in the circle. One or two characters; longer is truncated by the box. */
  initials: string
  /** The readable name. Truncates rather than wrapping the row to two lines. */
  name: string
  /** Wraps the avatar+name as one control (a dropdown trigger, a link). Default: a plain div. */
  as?: ElementType
  /** Beside the account, outside the control above — astrobot's theme toggle lives here. */
  trailing?: ReactNode
  className?: string
  /** Forwarded to the `as` element, so a trigger keeps its own props. */
  controlProps?: Record<string, unknown>
}

export function AccountRow({ initials, name, as: Control = "div", trailing, className, controlProps }: AccountRowProps) {
  return (
    <div data-slot="account-row" className={cn("flex items-center gap-1", className)}>
      <Control
        data-slot="account-control"
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-colors hover:bg-accent data-[state=open]:bg-accent"
        {...controlProps}
      >
        <div className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/20 text-[11px] font-semibold text-primary">
          {initials}
        </div>
        <span className="truncate text-sm text-muted-foreground">{name}</span>
      </Control>
      {trailing}
    </div>
  )
}
