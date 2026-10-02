# astro-ui — primitives & mechanics analysis (before building)

> The reviewer's "~10 primitives, 3 hard problems" was the **astrochat-MVP cut** — the minimum to
> get the app moving. It is NOT the whole design system. This analysis maps the **full** set of both,
> grounded in the two real inventories (Hermes ~50 components, astrobot ~45) + DESIGN-DNA's
> solved-mechanics + standard design-system practice. Status: **HAVE** (built, gated) · **GAP**
> (mapped, not built) · **MISSING** (not yet considered / pulled from shadcn / app-chrome only).

---

## PART A — Primitives, by tier (full set ≈ 50, not 10)

We have **15**, and they are all in ONE tier: the **comms domain** (our differentiation). A real
design system needs the foundation/overlay/layout/nav/feedback tiers under them. Most of the missing
ones are shadcn atoms we can **pull, not author** (per the shadcn decision).

### Tier 0 — Foundation atoms  *(mostly MISSING; pull from shadcn)*
`Button` · `IconButton` · `Input` · `Textarea`(HAVE, shadcn) · `Select` · `Checkbox` · `Radio` ·
`Switch` · `Toggle` · `Slider` · `Kbd` · `Badge` · `Separator` · `Spinner` · `Skeleton` · `ScrollArea` ·
`VisuallyHidden`. → **almost none in the catalog**; used ad-hoc in app chrome or not at all.

### Tier 1 — Overlays & portals  *(the anchor now built — rest MISSING)*
**HAVE:** `Overlay/Modal` + `Drawer/Sheet` (`ui/overlay.tsx`, ONE Radix-Dialog primitive,
`placement=center|right|left|bottom`; Settings dogfoods it) · `Menu/DropdownMenu` (`ui/menu.tsx`
on Radix — account menu now uses it, verified: portal, z=--z-dropdown, roving keyboard nav) ·
`Toast/Toaster` (sonner, wired at app root, z=--z-toast; fires on send). Still MISSING: `Popover` ·
`ContextMenu` · `Tooltip` (astrobot's `Tip` is app-wide) · `CommandPalette` (⌘K). **The overlay
tier carries the hard mechanics — Overlay/Menu already brought focus-trap + portal + z-index (Part B).**

### Tier 2 — Layout & structure
`Stack` (HAVE) · `Grid` (MISSING) · `Box` (MISSING) · `AspectRatio` (MISSING) ·
`Resizable/SplitPane` (HAVE — built in the app, should become a component) · `AppShell` (MISSING —
the 4-zone grid is app chrome).

### Tier 3 — Navigation
`ChannelButton` (HAVE) · `Tabs` (MISSING) · `Breadcrumb` (MISSING) · `Pagination` (MISSING).

### Tier 4 — Feedback & status
`AlertBanner` (HAVE) · `Empty` (MISSING — the empty≠unknown states) · `Progress` (MISSING) ·
`StatusPill`/situation (MISSING) · `Spinner`/`Skeleton` (MISSING).

### Tier 5 — Data display
`Table/DataList` (MISSING) · `FileGrid` (GAP) · `MessageResultRow` (GAP).

### Tier 6 — Comms domain  *(the differentiation — mostly HAVE)*
`MessageBubble` · `ConversationItem` (row+thread) · `Composer` · `Dossier` · `RichText` ·
`ThreadMarker` · `ListSection` · `Chip` · `Attachment` · `SearchField` · `ChipInput` (all HAVE) ·
`VoiceNote` · `RichEmailBody` · `MediaLightbox` · `RosterPanel` (GAP, host-owned).

**Read:** astrochat can ship on the comms tier + a handful of atoms/overlays. But the *catalog* the
reviewer's "10" implied is really **~50** across 7 tiers — the comms tier is the top, not the base.

---

## PART B — Hard mechanics ("le rogne", full set ≈ 14, not 3)

The reviewer named 3; there are ~14 real UI mechanics that need a *solved* approach, not CSS-per-
component. These are the "solve once in the system" problems. Status + which owns it:

| Mechanic | Status | Owner / how |
|---|---|---|
| **Resizable panes** | ✅ DONE | app owns widths, handle reports drag (astrobot model) |
| **Chat scroll** (stick-to-bottom only when parked; jump-to-latest FAB + unseen count; sending pins) | ✅ DONE | app-level scroll controller on the catalog's `[data-slot="conversation-thread"]`; verified live. *load-earlier windowing still open (see Virtualization).* |
| **Keyboard nav** (roving tabindex in menus, Escape, focus return) | 🟡 → mostly | Radix Menu/Overlay give roving-tabindex + Escape + focus-return (verified); global ⌘K/shortcut system still open |
| **Z-index / overlay authority** (one layer system: base < sticky < dropdown < scrim < modal < toast) | ✅ DONE | `--z-*` ladder in `globals.css`; `.menu`/`.scrim`/`.resizer` + Overlay all read a rung |
| **Focus management** (trap in modals, restore on close, focus-visible) | ✅ DONE | `Overlay` primitive (`ui/overlay.tsx`) on Radix Dialog — trap + restore + Escape + portal + scroll-lock, verified live |
| **Virtualization** (long threads/lists render only visible) | ❌ MISSING | list/thread components + a windowing lib |
| **Portal positioning** (anchored popover/menu/tooltip, collision/flip) | ❌ MISSING | floating-ui / Radix under the overlay tier |
| **Truncation / overflow discipline** (`min-w-0`, Radix ScrollArea `display:table` fix) | 🟡 PARTIAL | applied in components; ScrollArea fix pending when we pull it |
| **No-flash theming + tokens** | ✅ DONE | `<html>` script + the token system |
| **Reduced-motion** | ✅ DONE | the guard we added (astrobot's gap) |
| **Responsive / density** (collapse, mobile back-stack) | 🟡 PARTIAL | media queries + `viewing` toggle; no density system |
| **Drag & drop** (reorder rows, drop files on composer) | ❌ MISSING | rows + composer (astrobot has DnD) |
| **Async / optimistic + honest states** (sending bubble, loading/empty/error — empty≠unknown) | 🟡 PARTIAL | composer send is optimistic; no loading/empty/error system |
| **RTL / i18n** | ❌ MISSING | token + layout direction plumbing |

**Read:** 3 done, 4 partial, 7 missing. The 3 the reviewer named (resize · scroll · z-index) are the
most *acute* for astrochat, but the system owes ~14.

---

## PART C — Recommendation (reconcile "10/3" with the full picture)

Both are true and they're not in conflict — they're two scopes:

1. **astrochat-critical cut** (ship the app): the comms tier (HAVE) + pull ~6 shadcn atoms
   (Button/Input/Select/Dialog/Menu/Tooltip) + finish the **3 acute mechanics** (resize ✅, scroll,
   z-index) + focus-management (comes free with the Radix overlay). This is small and near-done.
2. **Full catalog** (the real design system): ~50 primitives across 7 tiers + ~14 mechanics, built
   over time, **each through the gates**. This is what makes it reusable beyond astrochat.

**Proposed order (unchanged in spirit, honest in scope):**
- Finish the **astrochat-critical cut** first (scroll + z-index + pull the 6 atoms + the Overlay that
  brings focus/portal/z-index with it) → astrochat ships.
- Then grow the **catalog by tier** (foundation atoms → overlays → nav/feedback → data), each gated,
  each with a `contract` + `stable` flag.
- Keep the **domain tier** (our 15) as the anchor — it's the differentiation, already built + anchored.

The mistake to avoid: calling the "10 primitives / 3 rogne" the finish line. It's the MVP line. The
catalog is ~50/~14, and that's the honest size — which is *why* it shouldn't be counted as "almost done."
