import type { ReactNode } from "react"
import { z } from "zod"

import { cn } from "../lib/utils"

// Stack — a generic layout container in the catalog: renders its declared children in a flex
// column (or row) with a gap. This is what lets a single declared tree express a LIST of siblings
// (the channel rail's buttons, the conversation list's rows) with one allow-listed root node,
// instead of every pane needing a bespoke container component.
export const stackPropsSchema = z.object({
  direction: z.enum(["column", "row"]).optional(),
  gap: z.number().optional(),
  align: z.enum(["start", "center", "stretch"]).optional(),
  padding: z.string().optional(),
  className: z.string().optional(),
})

export type StackProps = z.infer<typeof stackPropsSchema>

const ALIGN = { start: "items-start", center: "items-center", stretch: "items-stretch" } as const

function Stack({ direction = "column", gap = 6, align = "stretch", padding, className, children }: StackProps & { children?: ReactNode }) {
  return (
    <div
      data-slot="stack"
      className={cn("flex", direction === "row" ? "flex-row" : "flex-col", ALIGN[align], className)}
      style={{ gap, padding }}
    >
      {children}
    </div>
  )
}

export { Stack }
