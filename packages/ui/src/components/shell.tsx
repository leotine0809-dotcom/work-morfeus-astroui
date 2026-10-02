import * as React from "react"

import { cn } from "../lib/utils"
import { GEOMETRY } from "../tokens/index"
import { ResizeHandle } from "./resize-handle"

// Shell — the three-column resizable frame, extracted verbatim from astrobot's `app/page.tsx`
// (phase 53 t5): a LIST/ICON left column that snaps width, a MAIN pane, and an optional RIGHT
// rail — each preceded by its own resize handle when the caller wires one up. Below
// `GEOMETRY.narrowMaxPx` it becomes a one-column phone back-stack (`list` ⇆ `main`), no handles,
// no right rail — Part K responsiveness. `banner` renders BEFORE the frame (a fixed degrade
// warning); `children` renders AFTER it (modals, so they stack above everything). This component
// owns only the DOM shape: it fetches nothing, persists nothing, and the widths/collapse/drag
// state stay with the caller (astrobot's `usePageState`) exactly as they do today.
export interface ShellProps {
  /** The left column's expanded (LIST) content. */
  list: React.ReactNode
  /** The left column's collapsed (ICON) content, shown instead of `list` when `showIcon`. */
  icon?: React.ReactNode
  /** Swaps `list` for `icon` and sizes the left column to `GEOMETRY.iconRailPx` instead of `leftWidth`. */
  showIcon?: boolean
  /** The left column's width in px while expanded (ignored while `showIcon`). */
  leftWidth: number
  /** The center pane. Always rendered on desktop; rendered alone on narrow when `mobilePane==="main"`. */
  main: React.ReactNode
  /** The right rail's content. A resize handle precedes it automatically when `onRightResize` is given. */
  right?: React.ReactNode
  /** Rendered BEFORE the frame — a fixed banner (e.g. a degrade warning), never inside the columns. */
  banner?: React.ReactNode
  /** Rendered AFTER the frame — modals/dialogs. */
  children?: React.ReactNode
  /** True while a phone-width back-stack should render instead of the three-column frame. */
  narrow?: boolean
  /** Which pane the phone back-stack shows. Ignored when `narrow` is false. */
  mobilePane?: "list" | "main"
  /** True while a handle drag is in flight — suspends the left column's width transition so it
   *  tracks the pointer with no lag, then re-enables it on release. */
  dragging?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  /** Reports the pointer's clientX during a left-handle drag. Omitted hides the left handle. */
  onLeftResize?: (clientX: number) => void
  /** `false` hides the left handle even when `onLeftResize` is given (e.g. a center-stage place
   *  that forces the icon rail). Default `true`. */
  leftResizable?: boolean
  /** Reports the pointer's clientX during a right-handle drag. The handle renders only when this
   *  AND `right` are both given. */
  onRightResize?: (clientX: number) => void
}

export function Shell({
  list,
  icon,
  showIcon = false,
  leftWidth,
  main,
  right,
  banner,
  children,
  narrow = false,
  mobilePane = "list",
  dragging = false,
  onDragStart,
  onDragEnd,
  onLeftResize,
  leftResizable = true,
  onRightResize,
}: ShellProps) {
  if (narrow) {
    return (
      <>
        {banner}
        <div className="flex h-dvh w-full overflow-hidden bg-background">
          {mobilePane === "list" ? <div className="flex h-full w-full flex-col">{list}</div> : main}
        </div>
        {children}
      </>
    )
  }

  const showLeftHandle = !!onLeftResize && leftResizable !== false
  const showRightHandle = !!right && !!onRightResize

  return (
    <>
      {banner}
      <div className="flex h-dvh w-full overflow-hidden bg-background">
        <div
          className={cn("h-full shrink-0", dragging ? "" : "transition-[width] duration-150")}
          style={{ width: showIcon ? GEOMETRY.iconRailPx : leftWidth }}
        >
          {showIcon ? icon : list}
        </div>

        {showLeftHandle && (
          <ResizeHandle onResize={onLeftResize!} onStart={onDragStart} onEnd={onDragEnd} />
        )}

        {main}

        {showRightHandle && (
          <>
            <ResizeHandle onResize={onRightResize!} onStart={onDragStart} onEnd={onDragEnd} />
            {right}
          </>
        )}
      </div>
      {children}
    </>
  )
}
