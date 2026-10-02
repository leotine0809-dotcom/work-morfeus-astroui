import { z } from "zod"
import { Search, ChevronUp, ChevronDown } from "lucide-react"

// SearchField — one search input, two uses via props (redundancy pass: FindBar = SearchField + a
// match counter, not a separate component). Plain: icon + input + optional shortcut kbd. Find mode
// (when `count` is set): + "index/total" + prev/next. Declarative shell — the value/steps are
// host-mediated (uncontrolled input read via `data-key`; buttons carry `data-action`).
export const searchFieldPropsSchema = z.object({
  placeholder: z.string().optional(),
  value: z.string().optional(),
  shortcut: z.string().optional(),
  count: z.number().optional(),
  index: z.number().optional(),
  dataKey: z.string().optional(),
})

export type SearchFieldProps = z.infer<typeof searchFieldPropsSchema>

function SearchField({ placeholder = "Search", value, shortcut, count, index, dataKey }: SearchFieldProps) {
  const find = count != null
  return (
    <div data-slot="search-field" className="flex items-center gap-2 rounded-lg border border-border bg-[var(--card)] px-3 py-2">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        data-key={dataKey}
        defaultValue={value}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
      />
      {find ? (
        <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
          <span className="tabular-nums">{index ?? 0}/{count}</span>
          <button type="button" data-action="find-prev" data-key={dataKey} aria-label="Previous match" className="grid size-5 place-items-center rounded hover:bg-accent hover:text-foreground"><ChevronUp className="size-3.5" /></button>
          <button type="button" data-action="find-next" data-key={dataKey} aria-label="Next match" className="grid size-5 place-items-center rounded hover:bg-accent hover:text-foreground"><ChevronDown className="size-3.5" /></button>
        </span>
      ) : (
        shortcut && <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-faint">{shortcut}</kbd>
      )}
    </div>
  )
}

export { SearchField }
