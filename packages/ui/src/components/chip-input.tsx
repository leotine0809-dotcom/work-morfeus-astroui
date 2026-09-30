import { z } from "zod"

// ChipInput — a token field (reworked from Hermes `thread/RecipientRow`). GENUINELY different from
// Chip: Chip *displays* a pill, ChipInput is a field that *produces* pills (recipients, tags). The
// existing tokens + the new input; add/remove is host-mediated (`data-action`, uncontrolled input
// read via `data-key`). Kept separate from Chip on purpose: different use, not "more extension".
export const chipInputPropsSchema = z.object({
  label: z.string().optional(),
  chips: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  dataKey: z.string().optional(),
})

export type ChipInputProps = z.infer<typeof chipInputPropsSchema>

function ChipInput({ label, chips = [], placeholder = "Add…", dataKey }: ChipInputProps) {
  return (
    <div data-slot="chip-input" className="flex flex-col gap-1">
      {label && <span className="text-[11px] font-medium text-muted-foreground">{label}</span>}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-[var(--card)] px-2 py-1.5">
        {chips.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 rounded-md bg-[var(--acc-dim)] py-0.5 pl-2 pr-1 text-[12.5px] text-[var(--accent-ink)]">
            {c}
            <button type="button" data-action="remove-chip" data-value={c} data-key={dataKey} aria-label={`Remove ${c}`} className="grid size-4 place-items-center rounded-full hover:bg-black/10">×</button>
          </span>
        ))}
        <input
          data-key={dataKey}
          placeholder={placeholder}
          aria-label={label ?? "Add"}
          className="min-w-[90px] flex-1 bg-transparent py-0.5 text-sm text-foreground outline-none placeholder:text-faint"
        />
      </div>
    </div>
  )
}

export { ChipInput }
