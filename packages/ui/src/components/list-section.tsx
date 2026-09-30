import type { ReactNode } from "react"
import { z } from "zod"
import { ChevronDown, Plus } from "lucide-react"

import { cn } from "../lib/utils"

// ListSection — reworked from astrobot `fleet.tsx`'s SectionHeader and Hermes `ThreadList`'s
// section labels into one astro catalog component: a collapsible group header for a grouped list
// (People / Channels, Focused / Everything, Important / Archived). Renders its child rows below the
// header unless `collapsed`. DECLARATIVE: the header carries `data-action="toggle-section"` +
// `data-key`; the host wires the collapse. (astrobot used `text-muted-foreground/80` — dropped the
// opacity so the label clears AA as real text.)
export const listSectionPropsSchema = z.object({
  label: z.string(),
  count: z.number().optional(),
  collapsed: z.boolean().optional(),
  dataKey: z.string().optional(),
})

export type ListSectionProps = z.infer<typeof listSectionPropsSchema>

function ListSection({ label, count, collapsed = false, dataKey, children }: ListSectionProps & { children?: ReactNode }) {
  return (
    <div data-slot="list-section" className="flex w-full flex-col">
      {/* astrobot fleet.SectionHeader: a group/sec ROW holding the toggle button + a hover-revealed
          per-section "+"; label is sentence-case text-xs/medium (never uppercased). */}
      <div className="group/sec flex items-center gap-1 px-2.5 pb-1 pt-2.5">
        <button
          type="button"
          data-action="toggle-section"
          data-key={dataKey}
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-center gap-1 text-left text-xs font-medium text-muted-foreground"
        >
          <ChevronDown className={cn("size-3 shrink-0 transition-transform", collapsed && "-rotate-90")} />
          <span className="truncate">{label}</span>
          {count != null && <span className="ml-1 font-mono text-[11px] text-faint">{count}</span>}
        </button>
        <button
          type="button"
          data-action="section-add"
          data-key={dataKey}
          aria-label="New in section"
          className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground focus-visible:opacity-100 group-hover/sec:opacity-100"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {!collapsed && children && <div className="flex flex-col">{children}</div>}
    </div>
  )
}

export { ListSection }
