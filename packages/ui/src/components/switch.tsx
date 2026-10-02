import { cn } from "../lib/utils"

// Switch — the token-styled on/off toggle used across the fleet (astrocalendar's
// Appearance/all-day/Meet toggles). No Radix: a plain <button role="switch"> so
// it can live anywhere. Fixed-lightness accent track, hairline off-state, white
// knob — legible on any accent in either theme.
export function Switch({ checked, onChange, className }: { checked: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[var(--accent-solid)]" : "bg-[var(--panel-2)] ring-1 ring-inset ring-border",
        className,
      )}
    >
      <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  )
}

// SwitchVisual — the switch APPEARANCE with no interactivity, for a row that is
// itself the button (a real <button> inside a <button> double-fires and cancels
// its own toggle). Pass the state; the parent owns the click.
export function SwitchVisual({ on, className }: { on: boolean; className?: string }) {
  return (
    <span className={cn(
      "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
      on ? "bg-[var(--accent-solid)]" : "bg-[var(--panel-2)] ring-1 ring-inset ring-border",
      className,
    )}>
      <span className={cn("inline-block size-4 rounded-full bg-white shadow transition-transform", on ? "translate-x-4" : "translate-x-0.5")} />
    </span>
  )
}
