import { z } from "zod"

import { cn } from "../lib/utils"

// MonthGrid — the calendar's month view: a fixed 6×7 grid of day cells, each with
// a day number and up to a few event chips ("+N more" when it overflows).
// Presentational: chips emit data-action="open-event", cells emit "pick-day".
export const monthGridPropsSchema = z.object({
  cells: z.array(
    z.object({
      date: z.string(), // YYYY-MM-DD
      day: z.string(),
      inMonth: z.boolean().optional(),
      isToday: z.boolean().optional(),
      isWeekend: z.boolean().optional(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      date: z.string(), // the YYYY-MM-DD the chip belongs to
      hue: z.number().optional(),
      allDay: z.boolean().optional(),
      recorded: z.boolean().optional(),
    }),
  ),
  maxPerDay: z.number().optional(),
})

export type MonthGridProps = z.infer<typeof monthGridPropsSchema>

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function MonthGrid({ cells, events, maxPerDay = 3 }: MonthGridProps) {
  const byDay: Record<string, MonthGridProps["events"]> = {}
  for (const e of events) (byDay[e.date] ||= []).push(e)

  return (
    <div data-slot="month-grid" className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-[var(--panel)]">
      <div className="grid shrink-0 grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1.5 text-center text-[11px] font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {cells.map((c) => {
          const evs = byDay[c.date] ?? []
          return (
            <div
              key={c.date}
              data-slot="month-cell"
              data-action="pick-day"
              data-key={c.date}
              className={cn(
                "min-h-0 space-y-0.5 border-b border-r border-border-soft p-1 last:border-r-0",
                !c.inMonth && "opacity-40",
                c.isWeekend && "bg-[var(--panel-2)]/40",
              )}
            >
              <div className="flex justify-end">
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full text-[11px] font-medium tabular-nums",
                    c.isToday ? "bg-[var(--accent-solid)] text-[var(--primary-foreground)]" : "text-foreground",
                  )}
                >
                  {c.day}
                </span>
              </div>
              {evs.slice(0, maxPerDay).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  data-action="open-event"
                  data-key={e.id}
                  title={e.title}
                  className={cn(
                    "flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10.5px]",
                    e.hue === undefined ? "bg-[var(--acc-dim)] text-[var(--accent-ink)]" : "text-foreground",
                  )}
                  style={
                    e.hue === undefined
                      ? undefined
                      : { background: `color-mix(in oklab, oklch(0.62 0.13 ${e.hue}) 20%, transparent)` }
                  }
                >
                  {e.recorded && <span className="size-1 shrink-0 rounded-full bg-primary" />}
                  <span className="truncate">{e.title}</span>
                </button>
              ))}
              {evs.length > maxPerDay && (
                <div className="px-1 text-[10px] text-muted-foreground">+{evs.length - maxPerDay} more</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { MonthGrid }
