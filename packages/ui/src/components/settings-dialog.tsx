import { z } from "zod"
import type { ReactNode } from "react"

import { cn } from "../lib/utils"
import { Overlay } from "./ui/overlay"

// SettingsDialog — the fleet's standard settings surface, reproduced from
// astrobot's SettingsModal: a wide dialog with a LEFT section nav (icons +
// labels; a top scroll-strip on phones) and a right content pane (section title
// + scrollable body). Content is composed from `SettingsGroup` (a card) and
// `SettingRow` (label + description on the left, a control on the right).
export const settingsDialogPropsSchema = z.object({
  open: z.boolean(),
  sections: z.array(z.object({ key: z.string(), label: z.string(), icon: z.any().optional() })),
  activeSection: z.string(),
  title: z.string().optional(),
})

export type SettingsDialogProps = z.infer<typeof settingsDialogPropsSchema>

function SettingsDialog({
  open,
  sections,
  activeSection,
  title,
  onOpenChange,
  onSection,
  children,
}: SettingsDialogProps & {
  onOpenChange?: (open: boolean) => void
  onSection?: (key: string) => void
  children?: ReactNode
}) {
  const active = sections.find((s) => s.key === activeSection)
  return (
    <Overlay
      open={open}
      onOpenChange={onOpenChange}
      placement="center"
      title={title ?? active?.label ?? "Settings"}
      hideTitle
      className="w-[min(960px,calc(100vw-2rem))] gap-0 p-0"
    >
      {/* astrobot's own heights, restored: the shared copy had flattened the phone
          case to 74vh, and on a phone that leaves the panel short of the space it
          has. 80vh narrow, 74vh from md up. */}
      <div data-slot="settings-dialog" className="flex h-[80vh] max-h-[680px] flex-col md:h-[74vh] md:flex-row">
        {/* nav — top strip on phones, left rail on desktop */}
        <nav className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-border bg-black/15 p-2.5 md:w-52 md:flex-col md:overflow-x-visible md:border-b-0 md:border-r">
          {sections.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onSection?.(s.key)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm transition-colors md:shrink",
                s.key === activeSection ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </nav>

        {/* content */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="border-b border-border px-4 py-4 md:px-6">
            <h2 className="text-lg font-semibold text-foreground">{active?.label ?? title}</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">{children}</div>
        </div>
      </div>
    </Overlay>
  )
}

// SettingsGroup — a card of rows with an optional soft group label above it.
function SettingsGroup({ label, children }: { label?: string; children?: ReactNode }) {
  return (
    <div>
      {label && <div className="mb-2 px-1 text-xs font-medium text-muted-foreground/80">{label}</div>}
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-[var(--card)]">{children}</div>
    </div>
  )
}

// SettingRow — a label + description on the left, a control on the right.
function SettingRow({ label, description, children }: { label: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3.5 sm:gap-6">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</div>}
      </div>
      {children && <div className="shrink-0 pt-0.5">{children}</div>}
    </div>
  )
}

export { SettingsDialog, SettingsGroup, SettingRow }
