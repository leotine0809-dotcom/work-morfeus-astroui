import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { z } from "zod"

import { cn } from "../lib/utils"

// WeekGrid — the fleet's calendar surface (net-new: the kit had no time-axis
// primitive). ONE component for the day/week time grid: a sticky time gutter +
// N day columns with hairline hour rules, an all-day band, a now-line, and
// overlap-lane-packed event blocks. Presentational + declarative like the rest
// of the kit — it emits `data-action="open-event"` / `data-action="pick-day"`
// with a `data-key`, and the host wires behavior (selection, opening a sheet).
//
// DIRECT MANIPULATION (opt-in): pass `onEventMove` to make timed blocks
// draggable (move the body, or grab the bottom edge to resize) and `onSlotCreate`
// to sweep an empty range into a new event (a plain click = a default block).
// Both snap to `snapMinutes` (default 15). Omit them and the grid is click-only,
// byte-identical to before — that is why every consumer that already uses it is safe.
//
// Colour follows the fleet's per-data rule: an event carries a `hue` (OKLCH H);
// lightness/chroma are FIXED per theme here so any hue stays legible and tints
// with neither the raw palette nor (unless hue is omitted) the app accent. An
// event with no hue falls back to the app accent tokens.
export const weekGridPropsSchema = z.object({
  days: z.array(
    z.object({
      /** ISO date (YYYY-MM-DD) of the column's local day. */
      date: z.string(),
      /** short weekday label, e.g. "Mon". */
      weekday: z.string(),
      /** day-of-month number label, e.g. "8". */
      day: z.string(),
      isToday: z.boolean().optional(),
      isWeekend: z.boolean().optional(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      /** RFC3339 datetime (timed) — required for timed events. */
      start: z.string(),
      end: z.string(),
      allDay: z.boolean().optional(),
      /** OKLCH hue for per-calendar colour; omit to use the app accent. */
      hue: z.number().optional(),
      location: z.string().optional(),
      tentative: z.boolean().optional(),
      /** the viewer cannot edit this event (drag is disabled for it). */
      readOnly: z.boolean().optional(),
      /** a recording exists for this event (the meet-code↔event join). */
      recorded: z.boolean().optional(),
    }),
  ),
  /** busy time on other calendars not shown as an event — hatched "shadow". */
  shadow: z
    .array(z.object({ start: z.string(), end: z.string() }))
    .optional(),
  /** first/last hour shown (default 0..24). */
  startHour: z.number().optional(),
  endHour: z.number().optional(),
  /** px per hour (default 48). */
  hourHeight: z.number().optional(),
  /** current time as RFC3339 — draws the now-line on today; omit to hide it. */
  nowISO: z.string().optional(),
  /** snap granularity for drag/resize/create, in minutes (default 15). */
  snapMinutes: z.number().optional(),
  /** hour to rest the scroll at when no meeting is earlier (default 7). The grid
   *  auto-scrolls to the first meeting of the range on mount / navigation so you
   *  land in the day, not at 00:00. */
  restHour: z.number().optional(),
})

export type WeekGridProps = z.infer<typeof weekGridPropsSchema> & {
  /** drag a block to move it, or its bottom edge to resize — new start/end (RFC3339). */
  onEventMove?: (id: string, startISO: string, endISO: string) => void
  /** sweep an empty range (or click) to create — start/end (RFC3339). */
  onSlotCreate?: (startISO: string, endISO: string) => void
}

type Ev = WeekGridProps["events"][number]

const DEFAULT_START = 0
const DEFAULT_END = 24
const DEFAULT_HOUR = 48

function minutesInto(iso: string, dayISO: string): number | null {
  const t = new Date(iso).getTime()
  const dayStart = new Date(dayISO + "T00:00:00").getTime()
  if (isNaN(t) || isNaN(dayStart)) return null
  return Math.round((t - dayStart) / 60000)
}

// isoFromDayMin — a local-day + minute-offset back to an RFC3339 instant.
// setMinutes overflows cleanly, so min = 1440 lands at 00:00 the next day.
function isoFromDayMin(dayISO: string, min: number): string {
  const d = new Date(dayISO + "T00:00:00")
  d.setMinutes(min)
  return d.toISOString()
}

function hhmm(min: number): string {
  const m = ((min % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

interface Placed {
  ev: Ev
  top: number
  height: number
  lane: number
  lanes: number
}

// layoutDay clamps timed events to one local day and packs overlaps into lanes.
function layoutDay(events: Ev[], dayISO: string, startHour: number, endHour: number, hourHeight: number): Placed[] {
  const winStart = startHour * 60
  const winEnd = endHour * 60
  const spans = events
    .filter((e) => !e.allDay)
    .map((e) => {
      const s = minutesInto(e.start, dayISO)
      const en = minutesInto(e.end, dayISO)
      if (s === null || en === null) return null
      if (en <= winStart || s >= winEnd) return null
      const start = Math.max(winStart, s)
      let end = Math.min(winEnd, en)
      if (end <= start) end = start + 15
      return { ev: e, start, end }
    })
    .filter((x): x is { ev: Ev; start: number; end: number } => x !== null)
    .sort((a, b) => a.start - b.start || a.end - b.end)

  const out: Placed[] = []
  let cluster: typeof spans = []
  let clusterEnd = -1
  const flush = () => {
    if (cluster.length === 0) return
    const laneEnds: number[] = []
    const picked: { i: number; lane: number }[] = []
    cluster.forEach((sp, i) => {
      let lane = laneEnds.findIndex((e) => e <= sp.start)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(sp.end)
      } else laneEnds[lane] = sp.end
      picked.push({ i, lane })
    })
    const lanes = laneEnds.length
    for (const { i, lane } of picked) {
      const sp = cluster[i]
      out.push({
        ev: sp.ev,
        top: ((sp.start - winStart) / 60) * hourHeight,
        height: ((sp.end - sp.start) / 60) * hourHeight,
        lane,
        lanes,
      })
    }
    cluster = []
    clusterEnd = -1
  }
  for (const sp of spans) {
    if (cluster.length > 0 && sp.start >= clusterEnd) flush()
    cluster.push(sp)
    clusterEnd = Math.max(clusterEnd, sp.end)
  }
  flush()
  return out
}

function coversDay(e: Ev, dayISO: string): boolean {
  const dayStart = new Date(dayISO + "T00:00:00").getTime()
  const dayEnd = dayStart + 86400000
  const s = new Date(e.start).getTime()
  const en = new Date(e.end).getTime()
  if (isNaN(s) || isNaN(en)) return false
  return s < dayEnd && en > dayStart
}

// RecordedMark — the transcribed-meeting cue: a tiny voice waveform rendered
// inline with the title (not a second dot — a calendar-colour dot already sits
// beside it). Asymmetric bar heights so it scans as a voice, not signal-strength.
function RecordedMark({ size = 10, title, ...rest }: { size?: number; title?: string } & React.SVGProps<SVGSVGElement>) {
  const bars: Array<[number, number]> = [
    [0.75, 4.5],
    [4.0, 9.5],
    [7.25, 6.5],
    [10.5, 3.5],
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 12.75 12" fill="currentColor" aria-hidden={title ? undefined : true} role={title ? "img" : undefined} {...rest}>
      {title && <title>{title}</title>}
      {bars.map(([x, h], i) => (
        <rect key={i} x={x} y={(12 - h) / 2} width={1.5} height={h} rx={0.75} />
      ))}
    </svg>
  )
}

function EventBlock({
  p,
  draggable,
  dimmed,
  onMoveStart,
  onResizeStart,
}: {
  p: Placed
  draggable: boolean
  dimmed: boolean
  onMoveStart: (e: React.PointerEvent) => void
  onResizeStart: (e: React.PointerEvent) => void
}) {
  const { ev } = p
  const width = 100 / p.lanes
  const accented = ev.hue === undefined
  // Per-hue colour with fixed L/C (legible across themes); accent fallback.
  const style: React.CSSProperties = accented
    ? {
        top: p.top,
        height: Math.max(p.height, 14),
        left: `${p.lane * width}%`,
        width: `calc(${width}% - 3px)`,
      }
    : {
        top: p.top,
        height: Math.max(p.height, 14),
        left: `${p.lane * width}%`,
        width: `calc(${width}% - 3px)`,
        // @ts-expect-error CSS var
        "--ev-h": String(ev.hue),
        background: "color-mix(in oklab, oklch(0.62 0.13 var(--ev-h)) 20%, transparent)",
        borderLeftColor: "oklch(0.62 0.13 var(--ev-h))",
      }
  return (
    <button
      type="button"
      data-slot="week-grid-event"
      data-action="open-event"
      data-key={ev.id}
      style={style}
      onPointerDown={draggable ? onMoveStart : undefined}
      className={cn(
        "group absolute overflow-hidden rounded-md border-l-2 px-1.5 py-0.5 text-left text-[11.5px] leading-tight",
        "transition-[filter] hover:brightness-110",
        accented
          ? "border-l-[color:var(--acc-line)] bg-[var(--acc-dim)] text-[var(--accent-ink)]"
          : "text-foreground",
        ev.tentative && "opacity-70",
        draggable && "cursor-grab active:cursor-grabbing",
        dimmed && "opacity-40",
      )}
      title={ev.title}
    >
      <span className="flex items-center gap-1 font-medium">
        <span className="truncate">{ev.title}</span>
        {ev.recorded && <RecordedMark className="shrink-0 text-primary" title="Recorded — searchable by what was said" />}
      </span>
      {ev.location && <span className="block truncate text-[10.5px] text-muted-foreground">{ev.location}</span>}
      {draggable && (
        // bottom resize handle — Google-native grab strip; visible on hover.
        <span
          data-slot="week-grid-resize"
          onPointerDown={onResizeStart}
          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize opacity-0 transition-opacity group-hover:opacity-100"
        >
          <span className="mx-auto block h-0.5 w-6 translate-y-0.5 rounded-full bg-current opacity-40" />
        </span>
      )}
    </button>
  )
}

// shadowForDay returns hatched-block positions (top/height px) for busy spans
// that intersect a given local day.
function shadowForDay(shadow: { start: string; end: string }[] | undefined, dayISO: string, startHour: number, endHour: number, hourHeight: number) {
  if (!shadow) return []
  const winStart = startHour * 60
  const winEnd = endHour * 60
  const out: { top: number; height: number }[] = []
  for (const s of shadow) {
    const a = minutesInto(s.start, dayISO)
    const b = minutesInto(s.end, dayISO)
    if (a === null || b === null) continue
    if (b <= winStart || a >= winEnd) continue
    const start = Math.max(winStart, a)
    const end = Math.min(winEnd, b)
    if (end <= start) continue
    out.push({ top: ((start - winStart) / 60) * hourHeight, height: ((end - start) / 60) * hourHeight })
  }
  return out
}

// A live drag in progress — mirrored into state for the ghost, kept in a ref for
// the window listeners. `move` retargets its day column (drag across days);
// `resize`/`create` stay in the column they began in.
type Drag =
  | { kind: "move"; id: string; day: string; oDay: string; oStart: number; startMin: number; endMin: number; durMin: number; grabMin: number }
  | { kind: "resize"; id: string; day: string; startMin: number; endMin: number }
  | { kind: "create"; day: string; anchorMin: number; startMin: number; endMin: number }

function WeekGrid({
  days,
  events,
  shadow,
  startHour = DEFAULT_START,
  endHour = DEFAULT_END,
  hourHeight = DEFAULT_HOUR,
  nowISO,
  snapMinutes = 15,
  restHour = 7,
  onEventMove,
  onSlotCreate,
}: WeekGridProps) {
  const hours: number[] = []
  for (let h = startHour; h < endHour; h++) hours.push(h)
  const bodyHeight = (endHour - startHour) * hourHeight
  const gutter = "3.25rem"
  const cols = `${gutter} repeat(${days.length}, minmax(0, 1fr))`
  const winStart = startHour * 60
  const winEnd = endHour * 60

  // Auto-scroll INTO the day: on mount and whenever the visible range changes,
  // land on the first timed meeting (a touch of context above it), or `restHour`
  // when the range has none — never stuck at 00:00. Settles once per range so a
  // background refresh or the user's own scroll is never yanked.
  const scrollRef = useRef<HTMLDivElement>(null)
  const settledFor = useRef("")
  const rangeKey = days.map((d) => d.date).join(",")
  const firstEventMin = useMemo(() => {
    let earliest = Infinity
    for (const e of events) {
      if (e.allDay) continue
      for (const d of days) {
        const s = minutesInto(e.start, d.date)
        if (s !== null && s >= winStart && s < winEnd) {
          if (s < earliest) earliest = s
          break
        }
      }
    }
    return earliest
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, rangeKey, winStart, winEnd])
  // A resting scroll that lands flush on an hour line tucks that hour's centred
  // gutter label half under the sticky all-day band — the top "07:00" reads as
  // clipped. LEAD offsets the rest position by exactly HALF a row, which is the
  // position that puts every hour line as far as possible from the sticky seam
  // (half a row above the seam, half below) — so no gutter label can ever land
  // on it at rest. Live-scrolled positions are unaffected.
  const LEAD = Math.round(hourHeight * 0.5)
  const scrollTopFor = (min: number) => Math.max(0, ((min - winStart) / 60) * hourHeight - LEAD)
  const restTop = scrollTopFor(Math.max(winStart, restHour * 60))

  // Range change: reset the settle latch and drop to the rest hour right away
  // (so navigation never flashes at midnight before events arrive).
  useLayoutEffect(() => {
    settledFor.current = ""
    if (scrollRef.current) scrollRef.current.scrollTop = restTop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey])
  // Once this range's events are in, refine to the first meeting (once).
  useEffect(() => {
    const el = scrollRef.current
    if (!el || settledFor.current === rangeKey || events.length === 0) return
    settledFor.current = rangeKey
    const targetMin = firstEventMin !== Infinity ? Math.max(winStart, firstEventMin - 60) : Math.max(winStart, restHour * 60)
    el.scrollTop = scrollTopFor(targetMin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey, events, firstEventMin])

  const nowMin = nowISO ? new Date(nowISO).getHours() * 60 + new Date(nowISO).getMinutes() : null
  const nowTop = nowMin !== null ? ((nowMin - startHour * 60) / 60) * hourHeight : null

  // --- direct manipulation (drag / resize / create) ---
  const colEls = useRef<Map<string, HTMLElement>>(new Map())
  const dragRef = useRef<Drag | null>(null)
  const [ghost, setGhost] = useState<Drag | null>(null)
  const movedRef = useRef(false)
  const downRef = useRef<{ x: number; y: number } | null>(null)

  const snap = (m: number) => Math.round(m / snapMinutes) * snapMinutes
  // pointer clientY within a given day column → snapped minute-of-day (clamped).
  const minAt = (day: string, clientY: number): number => {
    const el = colEls.current.get(day)
    if (!el) return winStart
    const r = el.getBoundingClientRect()
    const raw = winStart + ((clientY - r.top) / hourHeight) * 60
    return Math.max(winStart, Math.min(winEnd, snap(raw)))
  }
  const dayUnder = (clientX: number, fallback: string): string => {
    for (const [k, el] of colEls.current) {
      const r = el.getBoundingClientRect()
      if (clientX >= r.left && clientX < r.right) return k
    }
    return fallback
  }

  const onMove = (e: PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    if (!movedRef.current && downRef.current) {
      const dx = e.clientX - downRef.current.x
      const dy = e.clientY - downRef.current.y
      if (dx * dx + dy * dy < 16) return // < 4px: still a click
      movedRef.current = true
    }
    if (d.kind === "move") {
      const day = dayUnder(e.clientX, d.day)
      const m = minAt(day, e.clientY)
      let s = snap(m - d.grabMin)
      s = Math.max(winStart, Math.min(winEnd - d.durMin, s))
      const next: Drag = { ...d, day, startMin: s, endMin: s + d.durMin }
      dragRef.current = next
      setGhost(next)
    } else if (d.kind === "resize") {
      const m = minAt(d.day, e.clientY)
      const en = Math.max(d.startMin + snapMinutes, m)
      const next: Drag = { ...d, endMin: en }
      dragRef.current = next
      setGhost(next)
    } else {
      const m = minAt(d.day, e.clientY)
      const next: Drag = { ...d, startMin: Math.min(d.anchorMin, m), endMin: Math.max(d.anchorMin, m) }
      dragRef.current = next
      setGhost(next)
    }
  }

  const onUp = () => {
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("pointerup", onUp)
    document.body.style.userSelect = ""
    const d = dragRef.current
    dragRef.current = null
    setGhost(null)
    if (!d) return
    if (movedRef.current) {
      // a real drag happened — swallow the click it would otherwise generate so
      // the host doesn't also open the event's peek on the block we just moved.
      const swallow = (ev: MouseEvent) => {
        ev.stopPropagation()
        ev.preventDefault()
        window.removeEventListener("click", swallow, true)
      }
      window.addEventListener("click", swallow, true)
      setTimeout(() => window.removeEventListener("click", swallow, true), 300)
    }
    if (!movedRef.current) {
      // treated as a click: empty-slot click makes a default 1h block.
      if (d.kind === "create" && onSlotCreate) {
        const s = d.anchorMin
        onSlotCreate(isoFromDayMin(d.day, s), isoFromDayMin(d.day, Math.min(winEnd, s + 60)))
      }
      return
    }
    if (d.kind === "move" && onEventMove) {
      if (d.startMin !== d.oStart || d.day !== d.oDay) {
        onEventMove(d.id, isoFromDayMin(d.day, d.startMin), isoFromDayMin(d.day, d.endMin))
      }
    } else if (d.kind === "resize" && onEventMove) {
      onEventMove(d.id, isoFromDayMin(d.day, d.startMin), isoFromDayMin(d.day, d.endMin))
    } else if (d.kind === "create" && onSlotCreate) {
      const s = Math.min(d.startMin, d.endMin)
      const en = Math.max(d.startMin, d.endMin)
      if (en - s >= snapMinutes) onSlotCreate(isoFromDayMin(d.day, s), isoFromDayMin(d.day, en))
    }
  }

  // wire the window listeners; the caller has already set dragRef/downRef/movedRef.
  const arm = () => {
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    document.body.style.userSelect = "none"
  }

  const startMove = (e: React.PointerEvent, ev: Ev, day: string) => {
    if (!onEventMove || e.button !== 0 || ev.readOnly) return
    e.preventDefault()
    const s = minutesInto(ev.start, day) ?? winStart
    const en = minutesInto(ev.end, day) ?? s + 60
    const downMin = minAt(day, e.clientY)
    dragRef.current = { kind: "move", id: ev.id, day, oDay: day, oStart: s, startMin: s, endMin: en, durMin: en - s, grabMin: downMin - s }
    downRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = false
    arm()
  }
  const startResize = (e: React.PointerEvent, ev: Ev, day: string) => {
    if (!onEventMove || e.button !== 0 || ev.readOnly) return
    e.preventDefault()
    e.stopPropagation() // don't also start a move on the parent block
    const s = minutesInto(ev.start, day) ?? winStart
    const en = minutesInto(ev.end, day) ?? s + 60
    dragRef.current = { kind: "resize", id: ev.id, day, startMin: s, endMin: en }
    downRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = true // resizing is always a change
    arm()
  }
  const startCreate = (e: React.PointerEvent, day: string) => {
    if (!onSlotCreate || e.button !== 0) return
    // ignore pointerdowns that land on an event/handle — those carry their own drag.
    if ((e.target as HTMLElement).closest('[data-slot="week-grid-event"]')) return
    const m = minAt(day, e.clientY)
    dragRef.current = { kind: "create", day, anchorMin: m, startMin: m, endMin: m }
    downRef.current = { x: e.clientX, y: e.clientY }
    movedRef.current = false
    arm()
  }

  const ghostBlock = (day: string) => {
    if (!ghost || ghost.day !== day) return null
    const top = ((ghost.startMin - winStart) / 60) * hourHeight
    const height = Math.max(((ghost.endMin - ghost.startMin) / 60) * hourHeight, 14)
    return (
      <div
        className="pointer-events-none absolute inset-x-0.5 z-20 rounded-md border border-[color:var(--acc-line)] bg-[var(--acc-dim)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent-ink)] shadow-lg"
        style={{ top, height }}
      >
        {hhmm(ghost.startMin)} – {hhmm(ghost.endMin)}
      </div>
    )
  }

  return (
    <div data-slot="week-grid" className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-[var(--panel)]">
      {/* ONE scroll container for the whole grid — header, all-day band, and time body.
          The vertical scrollbar therefore sits to the RIGHT of all three, so it can
          never narrow the body's day columns out from under their date headers (the
          old three-sibling layout scrolled only the body, shearing the columns off the
          header by the scrollbar's width). The header + all-day ride pinned on top. */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {/* pinned header stack — weekday+date row + all-day band, sharing the body's
            exact column template so every column edge lines up top to bottom. */}
        <div className="sticky top-0 bg-[var(--panel)]" style={{ zIndex: "var(--z-sticky)" }}>
      {/* header: weekday + date per column */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: cols }}>
        <div className="border-r border-border-soft" />
        {days.map((d) => (
          <div
            key={d.date}
            data-slot="week-grid-day-head"
            data-action="pick-day"
            data-key={d.date}
            className={cn(
              "flex flex-col items-center gap-0.5 border-r border-border-soft py-2 last:border-r-0",
              d.isWeekend && "bg-[var(--panel-2)]",
            )}
          >
            <span className="text-[11px] font-medium text-muted-foreground">{d.weekday}</span>
            <span
              className={cn(
                "grid size-7 place-items-center rounded-full text-[13px] font-semibold tabular-nums",
                d.isToday ? "bg-[var(--accent-solid)] text-[var(--primary-foreground)]" : "text-foreground",
              )}
            >
              {d.day}
            </span>
          </div>
        ))}
      </div>

      {/* all-day band */}
      <div className="grid border-b border-border" style={{ gridTemplateColumns: cols }}>
        <div className="flex items-start justify-end border-r border-border-soft px-1.5 py-1 font-mono text-[9.5px] uppercase tracking-wide text-faint">
          all-day
        </div>
        {days.map((d) => {
          const allDay = events.filter((e) => e.allDay && coversDay(e, d.date))
          return (
            <div key={d.date} className="min-h-[1.75rem] space-y-0.5 border-r border-border-soft p-0.5 last:border-r-0">
              {allDay.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  data-slot="week-grid-allday"
                  data-action="open-event"
                  data-key={e.id}
                  className="block w-full truncate rounded bg-[var(--acc-dim)] px-1.5 py-0.5 text-left text-[11px] font-medium text-[var(--accent-ink)]"
                  title={e.title}
                >
                  {e.title}
                </button>
              ))}
            </div>
          )
        })}
      </div>

        </div>{/* /pinned header stack */}

        {/* scrolling time body — a direct child of the single scroller above, so it
            shares the header's column template exactly. */}
        <div className="grid" style={{ gridTemplateColumns: cols, height: bodyHeight }}>
          {/* time gutter */}
          <div className="relative border-r border-border-soft">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-1 -translate-y-1/2 font-mono text-[10px] tabular-nums text-faint"
                style={{ top: (h - startHour) * hourHeight }}
              >
                {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* day columns */}
          {days.map((d) => {
            const placed = layoutDay(events, d.date, startHour, endHour, hourHeight)
            const dragId = ghost && ghost.kind !== "create" && "id" in ghost ? ghost.id : null
            return (
              <div
                key={d.date}
                ref={(el) => {
                  if (el) colEls.current.set(d.date, el)
                  else colEls.current.delete(d.date)
                }}
                data-slot="week-grid-col"
                onPointerDown={onSlotCreate ? (e) => startCreate(e, d.date) : undefined}
                className={cn(
                  "relative border-r border-border-soft last:border-r-0",
                  d.isWeekend && "bg-[var(--panel-2)]/40",
                  onSlotCreate && "cursor-copy",
                )}
              >
                {/* shadow-busy (hatched, behind events) */}
                {shadowForDay(shadow, d.date, startHour, endHour, hourHeight).map((s, i) => (
                  <div
                    key={"sh" + i}
                    title="Busy on another calendar"
                    className="pointer-events-none absolute inset-x-0.5 rounded-sm border border-border-soft"
                    style={{
                      top: s.top,
                      height: Math.max(s.height, 6),
                      backgroundImage:
                        "repeating-linear-gradient(45deg, var(--border) 0, var(--border) 1px, transparent 1px, transparent 6px)",
                      opacity: 0.5,
                    }}
                  />
                ))}
                {/* hour rules */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="pointer-events-none absolute inset-x-0 border-t border-border-soft"
                    style={{ top: (h - startHour) * hourHeight }}
                  />
                ))}
                {/* now-line */}
                {d.isToday && nowTop !== null && nowTop >= 0 && nowTop <= bodyHeight && (
                  <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }}>
                    <span className="size-1.5 rounded-full bg-primary" />
                    <span className="h-px flex-1 bg-primary" />
                  </div>
                )}
                {/* events */}
                {placed.map((p) => (
                  <EventBlock
                    key={p.ev.id}
                    p={p}
                    draggable={!!onEventMove && !p.ev.readOnly}
                    dimmed={dragId === p.ev.id}
                    onMoveStart={(e) => startMove(e, p.ev, d.date)}
                    onResizeStart={(e) => startResize(e, p.ev, d.date)}
                  />
                ))}
                {/* drag ghost */}
                {ghostBlock(d.date)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { WeekGrid }
