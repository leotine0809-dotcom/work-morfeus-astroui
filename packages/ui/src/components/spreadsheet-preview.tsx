import * as React from "react"

import { cn } from "../lib/utils"

// SpreadsheetPreview — a dependency-free, presentational table for previewing a
// parsed spreadsheet (CSV or XLSX). It renders ROWS the host already parsed: the
// shared library owns the *look* of a spreadsheet preview (sticky header, sheet
// tabs, scroll, truncation, "showing first N" cap) so every astro app previews
// .csv/.xlsx identically, while each app keeps ownership of HOW it turns its own
// attachment bytes into rows (an app fetches its signed media URL and parses it;
// the parser — a tiny CSV splitter, SheetJS for XLSX — is the app's business, not
// this component's, so the shared bundle stays light).
//
// Honest-degrade, matching the rest of @astro/ui: an empty sheet renders a stated
// "no rows" instead of a blank frame; a parse error is the host's to pass in via
// `error`.

export interface SpreadsheetSheet {
  /** Sheet/tab name (a CSV has one, named e.g. after the file or "Sheet 1"). */
  name: string
  /** Row-major cells; row 0 is treated as the header. Ragged rows are padded. */
  rows: string[][]
}

export interface SpreadsheetPreviewProps {
  sheets: SpreadsheetSheet[]
  /** Cap on rendered body rows per sheet (perf guard); default 500. */
  maxRows?: number
  /** A parse/fetch error the host hit — shown as an honest state, not a blank. */
  error?: string
  /** Still fetching/parsing — shown as an honest "loading" state. */
  loading?: boolean
  className?: string
}

const DEFAULT_MAX_ROWS = 500

function SpreadsheetPreview({ sheets, maxRows = DEFAULT_MAX_ROWS, error, loading, className }: SpreadsheetPreviewProps) {
  const [active, setActive] = React.useState(0)

  // Keep the active tab valid if the sheet set changes under us.
  React.useEffect(() => {
    if (active > sheets.length - 1) setActive(0)
  }, [sheets.length, active])

  if (loading) {
    return <PreviewState className={className}>Reading spreadsheet…</PreviewState>
  }
  if (error) {
    return <PreviewState className={className}>{error}</PreviewState>
  }
  if (!sheets.length) {
    return <PreviewState className={className}>This spreadsheet has no sheets.</PreviewState>
  }

  const sheet = sheets[Math.min(active, sheets.length - 1)]
  const rows = sheet.rows ?? []
  const header = rows[0] ?? []
  const body = rows.slice(1)
  const shown = body.slice(0, maxRows)
  const colCount = rows.reduce((n, r) => Math.max(n, r.length), 0)

  return (
    <div data-slot="spreadsheet-preview" className={cn("flex min-h-0 flex-col", className)}>
      {sheets.length > 1 ? (
        <div className="flex flex-none items-center gap-1 overflow-x-auto border-b border-border bg-[var(--card)] px-2 py-1">
          {sheets.map((s, i) => (
            <button
              key={`${s.name}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                i === active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60",
              )}
            >
              {s.name || `Sheet ${i + 1}`}
            </button>
          ))}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <PreviewState>This sheet is empty.</PreviewState>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-max min-w-full border-collapse text-[12px]">
            <thead className="sticky top-0 z-[1]">
              <tr>
                <th className="sticky left-0 z-[2] border-b border-r border-border bg-accent px-2 py-1.5 text-right font-mono text-[10px] font-normal text-muted-foreground">
                  {/* corner: row-number gutter header */}
                </th>
                {padTo(header, colCount).map((cell, c) => (
                  <th
                    key={c}
                    className="max-w-[280px] truncate border-b border-r border-border bg-accent px-2.5 py-1.5 text-left font-semibold text-foreground"
                    title={cell}
                  >
                    {cell || columnLabel(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row, r) => (
                <tr key={r} className="even:bg-accent/40">
                  <td className="sticky left-0 z-[1] border-b border-r border-border bg-accent px-2 py-1 text-right font-mono text-[10px] text-muted-foreground">
                    {r + 2}
                  </td>
                  {padTo(row, colCount).map((cell, c) => (
                    <td
                      key={c}
                      className="max-w-[320px] truncate border-b border-r border-border/60 px-2.5 py-1 text-foreground"
                      title={cell}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-none items-center justify-between gap-2 border-t border-border bg-[var(--card)] px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>
          {body.length} {body.length === 1 ? "row" : "rows"} · {colCount} {colCount === 1 ? "column" : "columns"}
        </span>
        {body.length > shown.length ? <span>showing first {shown.length}</span> : null}
      </div>
    </div>
  )
}

function PreviewState({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid place-items-center p-8 text-[12.5px] text-muted-foreground", className)}>{children}</div>
  )
}

// padTo returns a copy of row padded with empty strings up to `len`, so a ragged
// sheet (a short row) still lines its cells up under the right columns.
function padTo(row: string[], len: number): string[] {
  if (row.length >= len) return row
  return [...row, ...Array<string>(len - row.length).fill("")]
}

// columnLabel gives a spreadsheet-style A, B, …, Z, AA header for a column with
// no header text, so an empty first row still yields navigable columns.
function columnLabel(index: number): string {
  let n = index
  let label = ""
  do {
    label = String.fromCharCode(65 + (n % 26)) + label
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return label
}

export { SpreadsheetPreview }
