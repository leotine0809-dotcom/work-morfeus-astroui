import { Children, forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { z } from "zod"
import { cva } from "class-variance-authority"

import { cn } from "../lib/utils"

// ConversationItem — two presentations from one component (phase 53 t4, PD-8):
//   • BARE ROW (no children): one row in the conversation list — an `avatar` slot, the unread dot
//     + title, a `meta` slot in the right cell (falling back to the plain `time` string for the
//     JSON-only declarative path, which cannot hand in a node), `caption`, and `preview` with an
//     optional inline colour. `selected` fills it with the accent (astrobot's fleet.Row treatment,
//     ABOT-017) — a `<button>` now, not a `<div>`, so `ref` reaches it for astrobot's
//     `ContextMenuTrigger asChild` (fleet.tsx, t16).
//   • CONVERSATION VIEW (has children): the open thread — a sticky header (avatar slot + name +
//     caption), the declared children in a scrollable body, and the last declared child as a
//     footer bar (the spike's convention: the LAST child is the Composer). Kept for the spike,
//     made copy-free — no hardcoded presence/channel copy, just the neutral `caption` slot.
// Domain (channel/channelKey/presence/group/hue/avatarSrc) is gone: an avatar and any right-cell
// decoration are slots the caller composes, never schema fields the library renders itself
// (PD-5/PD-9 — the mapping from a runtime row to these props lives in astrobot's ui-adapter.ts).
// Context menu, mascot and status polling stay in astrobot's fleet.tsx around this row.
export const conversationItemPropsSchema = z.object({
  name: z.string(),
  preview: z.string().optional(),
  time: z.string().optional(),
  unread: z.number().optional(),
  caption: z.string().optional(),
  selected: z.boolean().optional(),
  dataKey: z.string().optional(),
})

export type ConversationItemProps = z.infer<typeof conversationItemPropsSchema>

const rowVariants = cva(
  "flex w-full items-center gap-3.5 rounded-lg px-3 py-3 text-left transition-colors",
  {
    variants: {
      selected: {
        true: "bg-accent",
        false: "hover:bg-accent/60",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
)

// TRANSPARENT TO COMPOSITION, and it is a contract, not a courtesy.
//
// A host wraps this row in a context menu, a tooltip, a drag handle — every one
// of which works by CLONING the child and injecting props onto it
// (`onContextMenu`, `onPointerDown`, `data-state`, `aria-*`). A component that
// accepts only its declared props swallows all of that, and the wrapper fails
// SILENTLY: nothing throws, nothing logs, the gesture simply stops existing.
//
// That is not hypothetical. astrobot's agent rows lost right-click entirely the
// day they moved from a local `<button>` to this component — ten working menu
// items, delete included, became unreachable and nobody could tell why, because
// a `<button>` had always absorbed the injected handlers and a library
// component with a fixed prop list does not.
//
// So the rest of the props go on the root, and conversation-item.test.tsx
// refuses a build where they do not.
export interface ConversationItemComponentProps
  extends ConversationItemProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "name"> {
  avatar?: ReactNode
  meta?: ReactNode
  previewColor?: string
  onSelect?: () => void
  children?: ReactNode
}

const ConversationItem = forwardRef<HTMLButtonElement, ConversationItemComponentProps>(
  function ConversationItem(
    { name, preview, time, unread, caption, selected = false, dataKey, avatar, meta, previewColor, onSelect, children, ...rest },
    ref,
  ) {
    if (children) {
      const kids = Children.toArray(children)
      const footer = kids.length > 1 ? kids[kids.length - 1] : null
      const body = footer ? kids.slice(0, -1) : kids
      return (
        <div data-slot="conversation-view" className="flex min-h-0 w-full flex-1 flex-col">
          <header
            data-slot="conversation-item"
            className="flex h-[var(--app-header-h)] shrink-0 items-center gap-2 border-b border-border px-4"
          >
            {avatar && <div className="shrink-0">{avatar}</div>}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name}</div>
              {caption && <div className="truncate text-xs text-muted-foreground">{caption}</div>}
            </div>
          </header>
          <div data-slot="conversation-thread" className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6">{body}</div>
          </div>
          {footer && (
            <div data-slot="thread-footer" className="shrink-0 px-4 pb-4 pt-2">
              {footer}
            </div>
          )}
        </div>
      )
    }

    return (
      <button
        ref={ref}
        type="button"
        data-slot="conversation-item"
        data-key={dataKey}
        data-selected={selected}
        {...rest}
        // BOTH RUN, and the row's own action is never the one that loses.
        //
        // The spread above is what makes a wrapper's handlers reach the DOM, but a bare
        // `onClick={onSelect}` before it would be REPLACED by a wrapper's own onClick, and a bare
        // one after it would replace the wrapper's — either way one of them vanishes with nothing
        // to show for it, which is exactly the failure this component was just fixed for. So they
        // compose: the wrapper's first, then selection, unless the wrapper stopped the event.
        onClick={(e) => {
          rest.onClick?.(e)
          // `e?.` — the event is optional on purpose. A handler that assumed one would throw the
          // moment anything invoked it synthetically (a test, a programmatic click), and a row
          // that can only be clicked by a real mouse is a row that cannot be exercised.
          if (!e?.defaultPrevented) onSelect?.()
        }}
        // `data-slot` is deliberately BEFORE the spread: a wrapper that renames the node (Radix's
        // `asChild` stamps its own `data-slot="context-menu-trigger"`) is telling the truth about
        // what it has become, and nothing in the app selects on the row's own value.
        className={cn(rowVariants({ selected }), rest.className)}
      >
        {avatar && <div className="shrink-0">{avatar}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              {unread ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}
              <span className={cn("truncate text-[15px]", unread ? "font-semibold text-foreground" : "font-medium")}>{name}</span>
            </div>
            {(meta ?? time) && <span className="shrink-0 text-[11px] text-muted-foreground">{meta ?? time}</span>}
          </div>
          {caption && <div className="truncate text-[11px] text-muted-foreground/80">{caption}</div>}
          {preview && (
            <div
              className={cn("truncate text-[13px]", unread ? "text-foreground/80" : "text-muted-foreground")}
              style={previewColor ? { color: previewColor } : undefined}
            >
              {preview}
            </div>
          )}
        </div>
      </button>
    )
  },
)

export { ConversationItem }
