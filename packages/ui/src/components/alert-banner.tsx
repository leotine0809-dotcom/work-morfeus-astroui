import { z } from "zod"
import { Info, TriangleAlert, X } from "lucide-react"

// AlertBanner — reworked from astrobot `SecretsWarning` + Hermes degrade notices into one catalog
// component: a dismissible banner making a degrade VISIBLE without blocking (the honesty doctrine).
// Solid `--card` ground + a tone-coloured left border (not a tinted bg — muted text on a
// semi-transparent tint fails axe). Dismiss is host-mediated (`data-action="dismiss"`).
export const alertBannerPropsSchema = z.object({
  tone: z.enum(["info", "warn"]).optional(),
  title: z.string(),
  detail: z.string().optional(),
  dismissible: z.boolean().optional(),
  dataKey: z.string().optional(),
})

export type AlertBannerProps = z.infer<typeof alertBannerPropsSchema>

function AlertBanner({ tone = "info", title, detail, dismissible, dataKey }: AlertBannerProps) {
  const color = tone === "warn" ? "var(--amber)" : "var(--primary)"
  const Icon = tone === "warn" ? TriangleAlert : Info
  return (
    <div
      data-slot="alert-banner"
      className="flex items-start gap-2.5 rounded-lg border border-border bg-[var(--card)] px-3 py-2.5"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <Icon className="mt-px size-4 shrink-0" style={{ color }} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">{title}</div>
        {detail && <div className="mt-0.5 text-[12.5px] text-muted-foreground">{detail}</div>}
      </div>
      {dismissible && (
        <button type="button" data-action="dismiss" data-key={dataKey} aria-label="Dismiss" className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export { AlertBanner }
