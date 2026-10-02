import type { ElementType, HTMLAttributes, ReactNode } from "react"
import { cn } from "../lib/utils"

// Band — the app's top strip, and the same strip in every app.
//
// WHY THIS GREW SLOTS. The first version shared only the HEIGHT
// (`h-[var(--app-header-h)]` + a border), and that turned out not to be enough:
// three apps put the same band at the same height and it still read as three
// different products — one had a small logo tight to the edge, another a large
// one with different padding, a third something else again. Height is not
// anatomy. Anatomy is WHICH slots exist, in what order, and how big.
//
// So the arrangement is CLOSED (ADR-039: geometry and rhythm belong to the
// library) and the CONTENT of each slot is the app's own (identity). An app
// cannot move the lead to the right or change the gap; it decides what its
// brand mark is.
//
// The shape is astrobot's, measured, because astrobot is the reference:
//   flex · h-[var(--app-header-h)] · shrink-0 · items-center · justify-between
//   · gap-2 · border-b · px-4
//
// `children` still works for a band that is one undivided row (the channel
// headers use it), so nothing that adopted the height-only version breaks.
export interface BandProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Leading cell: the brand mark, or whatever leads on this surface. */
  lead?: ReactNode
  /** Optional middle cell. Takes the free space and truncates rather than pushing the actions.
   *  Named for its POSITION, not "title": that would shadow the HTML `title` attribute and cost
   *  the band its tooltip, and position is what this anatomy is actually about. */
  center?: ReactNode
  /** Trailing cluster. Its own gap is fixed so two apps' action rows line up. */
  actions?: ReactNode
  /** One undivided row. Ignored when any slot above is given. */
  children?: ReactNode
}

export function Band({ className, lead, center, actions, children, ...rest }: BandProps) {
  const slotted = lead !== undefined || center !== undefined || actions !== undefined
  return (
    <div
      data-slot="band"
      className={cn(
        "flex h-[var(--app-header-h)] shrink-0 items-center gap-2 border-b border-border px-4",
        slotted && "justify-between",
        className,
      )}
      {...rest}
    >
      {slotted ? (
        <>
          {lead !== undefined && <div data-slot="band-lead" className="flex shrink-0 items-center">{lead}</div>}
          {center !== undefined && <div data-slot="band-center" className="min-w-0 flex-1 truncate">{center}</div>}
          {actions !== undefined && <div data-slot="band-actions" className="flex shrink-0 items-center gap-1">{actions}</div>}
        </>
      ) : (
        children
      )}
    </div>
  )
}
