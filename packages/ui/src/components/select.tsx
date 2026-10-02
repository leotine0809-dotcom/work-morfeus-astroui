import * as React from "react"
import { ChevronDown } from "lucide-react"

// Select — the fleet's native-<select> in a token skin: a hairline pill with a
// chevron, `appearance-none` so the browser widget doesn't leak its own chrome.
// Native on purpose (keyboard, mobile wheel, accessibility for free); for a rich
// menu use `Menu` instead. `SettingSelect` is the historical alias.
export function Select({
  value,
  onChange,
  children,
  className,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={"relative " + (className ?? "")}>
      <select
        value={value}
        onChange={onChange}
        className="appearance-none rounded-lg border border-border bg-[var(--panel-2)] py-1.5 pl-3 pr-8 text-[13px] text-foreground outline-none transition-colors hover:bg-accent focus:border-[color:var(--acc-line)]"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export const SettingSelect = Select
