// @astro/ui — public API.
// The astro-style component kit: comms-domain components + overlay primitives + the design tokens
// (`import "@astro/ui/styles.css"`) + `cn`. Backend-agnostic React/TS — grow it while you build apps.
// Each `export *` re-exports the component, its Zod prop schema, and its inferred props type.

export * from "./components/stack"
export * from "./components/avatar"
export * from "./components/message-bubble"
export * from "./components/rich-text"
export * from "./components/list-section"
export * from "./components/chip"
export * from "./components/attachment"
export * from "./components/spreadsheet-preview"
export * from "./components/alert-banner"
export * from "./components/search-field"
export * from "./components/chip-input"
export * from "./components/conversation-item"
export * from "./components/composer"
export * from "./components/thread-marker"
export * from "./components/channel-button"
export * from "./components/dossier"
export * from "./components/channels"

// calendar tier — the time-axis surface (week/day grid) + month grid
export * from "./components/week-grid"
export * from "./components/month-grid"

// shell tier — the settings surface (horizontal-tabbed settings dialog) so no app reinvents it
export * from "./components/logo"
export * from "./components/switch"
export * from "./components/segmented"
export * from "./components/select"
export * from "./components/settings-dialog"

// frame tier — astrobot's proven shell shape (phase 53 t5/t13): the three-column resizable frame,
// its resize handle, and the 60px band header. `app-shell` (astrocalendar's private shell) is
// DELETED (phase 53 t13) — astrobot and astrocalendar both render through `Shell`/`Band` now.
export * from "./components/shell"
export * from "./components/band"
// AccountRow — the "who you are" row at the foot of the rail, normalised on
// astrobot's (24px initials circle, 14px muted name, gap-2.5 px-2.5 py-2) so the
// same corner of three products stops looking unrelated. Optional surface.
export * from "./components/account-row"
export * from "./components/resize-handle"

// overlay tier (Radix-backed) — focus-trap + portal + z-ladder come with them
export * from "./components/ui/overlay"
export * from "./components/ui/menu"
export * from "./components/ui/textarea"

// utilities + the toast surface
export { cn } from "./lib/utils"
export { useNarrowViewport } from "./lib/use-narrow-viewport"
export { Toaster, toast } from "sonner"
