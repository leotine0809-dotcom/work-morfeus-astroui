import * as React from "react"
import { useCallback } from "react"

// ResizeHandle — extracted verbatim from astrobot's `components/resizer.tsx` (phase 53 t5): a
// thin draggable divider (ABOT-010). Reports the ABSOLUTE pointer X during the drag so the
// caller can size a rail 1:1 with the cursor; `onStart`/`onEnd` let the caller suspend width
// transitions while dragging (follow the pointer with no lag) and re-enable them on release, so
// the snap back animates (ABOT-011). The clamp and the drag-below-snap threshold live in whoever
// OWNS the widths (Shell's consumer), not here — this component only measures.
export interface ResizeHandleProps {
  onResize: (clientX: number) => void
  onStart?: () => void
  onEnd?: () => void
}

export function ResizeHandle({ onResize, onStart, onEnd }: ResizeHandleProps) {
  const down = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onStart?.()
      const move = (ev: MouseEvent) => onResize(ev.clientX)
      const up = () => {
        window.removeEventListener("mousemove", move)
        window.removeEventListener("mouseup", up)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        onEnd?.()
      }
      window.addEventListener("mousemove", move)
      window.addEventListener("mouseup", up)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    },
    [onResize, onStart, onEnd],
  )

  return (
    <div
      onMouseDown={down}
      data-slot="resize-handle"
      className="group relative z-10 -mx-1 w-2 shrink-0 cursor-col-resize"
      aria-hidden
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover:bg-primary/40" />
    </div>
  )
}
