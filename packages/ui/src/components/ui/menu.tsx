import * as React from "react"
import { DropdownMenu as RD } from "radix-ui"

import { cn } from "../../lib/utils"

// Menu — astro-ui's dropdown/action-menu on Radix DropdownMenu. Replaces hand-rolled open-state +
// fixed-backdrop + absolutely-positioned panels: Radix owns open/close, click-outside, Escape,
// roving-tabindex keyboard nav, typeahead, focus return to the trigger, portal + collision-aware
// placement. Reads the z-ladder (--z-dropdown) so it can never paint over a modal. Presentational
// wrapper only — callers pass a `trigger` element and MenuItem children.

export function Menu({
  trigger,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  className,
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  sideOffset?: number
  className?: string
}) {
  return (
    <RD.Root>
      <RD.Trigger asChild>{trigger}</RD.Trigger>
      <RD.Portal>
        <RD.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-[var(--z-dropdown)] min-w-[250px] rounded-xl border border-border bg-[var(--card)] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,.4)]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95",
            className,
          )}
        >
          {children}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  )
}

export function MenuItem({
  icon,
  children,
  onSelect,
  right,
  className,
}: {
  icon?: React.ReactNode
  children: React.ReactNode
  onSelect?: () => void
  right?: React.ReactNode
  className?: string
}) {
  return (
    <RD.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13.5px] text-foreground outline-none",
        "data-[highlighted]:bg-accent focus-visible:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground",
        right && "justify-between",
        className,
      )}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {children}
      </span>
      {right}
    </RD.Item>
  )
}

export function MenuSeparator() {
  return <RD.Separator className="mx-1 my-1.5 h-px bg-border-soft" />
}
