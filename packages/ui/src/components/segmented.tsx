import { cn } from "../lib/utils"

// Segmented — a small inline single-choice control (day/week/month, this/all).
// Token-styled, generic over the value type. The active segment gets the accent
// wash; the rest are muted-hover. No Radix — a row of buttons in a hairline box.
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: { v: T; label: string }[]
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn("inline-flex rounded-lg border border-border p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[13px] font-medium capitalize transition-colors",
            value === o.v ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
