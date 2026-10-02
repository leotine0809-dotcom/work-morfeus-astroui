import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "../../lib/utils"

// Overlay — astro-ui's ONE portalled-overlay primitive, built on Radix Dialog. It is BOTH the
// Modal (placement="center") and the Drawer/Sheet (placement="right|left|bottom") — the reviewer's
// two overlay gaps collapsed into one, because they differ only in where the content sits, not in
// mechanics. Radix carries the three hard rogne for us: focus-trap (+ restore on close), portal
// (escapes any clipping/stacking-context ancestor), Escape/scrim-dismiss, and body-scroll-lock.
// We only own placement + our tokens + the z-ladder (scrim=--z-scrim, content=--z-modal), so a
// dropdown (--z-dropdown) can never paint over it and a toast (--z-toast) always sits above.
// Controlled (open/onOpenChange) or uncontrolled with a `trigger`. Title is REQUIRED for a11y —
// pass `hideTitle` to keep it screen-reader-only when the design has no visible heading.

type Placement = "center" | "right" | "left" | "bottom"

const anim = "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:duration-200 data-[state=closed]:duration-150"

const PLACEMENT: Record<Placement, string> = {
  center: cn(
    "left-1/2 top-1/2 max-h-[92svh] w-[min(920px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border",
    anim,
    "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
  ),
  right: cn(
    "right-0 top-0 h-full w-[min(440px,calc(100vw-3rem))] border-l border-border",
    anim,
    "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
  ),
  left: cn(
    "left-0 top-0 h-full w-[min(440px,calc(100vw-3rem))] border-r border-border",
    anim,
    "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  ),
  bottom: cn(
    "inset-x-0 bottom-0 max-h-[85svh] rounded-t-2xl border-t border-border",
    anim,
    "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
  ),
}

export interface OverlayProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  title: string
  hideTitle?: boolean
  description?: string
  placement?: Placement
  /** hide the built-in close affordance (e.g. when the header carries its own) */
  hideClose?: boolean
  className?: string
  children?: React.ReactNode
}

export function Overlay({
  open,
  onOpenChange,
  trigger,
  title,
  hideTitle,
  description,
  placement = "center",
  hideClose,
  className,
  children,
}: OverlayProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-[var(--z-scrim)] bg-black/50 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          )}
        />
        <Dialog.Content
          data-overlay={placement}
          className={cn(
            "fixed z-[var(--z-modal)] flex flex-col overflow-hidden bg-[var(--background)] shadow-[0_24px_80px_rgba(0,0,0,.5)] focus:outline-none",
            PLACEMENT[placement],
            className,
          )}
        >
          <Dialog.Title className={cn(hideTitle && "sr-only", !hideTitle && "px-5 pb-1 pt-4 text-lg font-semibold tracking-[-0.01em]")}>
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className={cn(hideTitle ? "sr-only" : "px-5 pb-2 text-sm text-muted-foreground")}>
              {description}
            </Dialog.Description>
          ) : (
            // Radix warns without a Description; supply an sr-only one derived from the title.
            <Dialog.Description className="sr-only">{title}</Dialog.Description>
          )}

          {children}

          {!hideClose && (
            <Dialog.Close
              aria-label="Close"
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Re-export the Radix Close so callers can place their own dismiss control inside `children`.
export const OverlayClose = Dialog.Close
