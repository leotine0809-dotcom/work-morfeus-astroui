# astro-ui — Design DNA (extracted from astrobot)

> **This file is the memory, not your head.** Every geometry, token, treatment, and solved-fix
> that took days to get right in the standalone **astrobot console** is captured here, literally,
> with `file:line` source refs into `C:/AI ARMY/astrobot/console`. Nobody has to *remember* these
> — they live here, and they become the **defaults of the astro-ui components**. astrochat (and any
> astro app) consumes astro-ui and inherits all of it.
>
> **How to use:** when something looks off, fix it **once in astro-ui** (and update this file), and
> it's fixed everywhere. When porting, work down the checklist below — each item links to its source
> of truth in astrobot. Re-run the extraction (`general-purpose` agent over the console source) if
> astrobot moves ahead and this drifts.

## Port status — the checklist to review once, then tick

- [x] **Brushed metal** — exact `.brushed-metal` (§2), no grain. Ported to the left sidebar.
- [x] **Selected row = plain grey `bg-accent`** — no accent tint, no border/ring (§3). Ported.
- [x] **Accent = ONE knob (`--acc-h` + `--acc-c`)** — every accent colour derives via `oklch(L C var(--acc-h))`; picker sets the 5 named accents Ice/Iris/Rose/Amber/Jade (§1). Ported. *(Pending: shift the neutral GREYS to `var(--acc-h)` too, so the whole surface tints with the accent — currently greys are fixed hue 232.)*
- [x] **Bubble-user LIGHTNESS fixed (0.52 dark)**, NOT `--primary` — white-ink contrast independent of accent (§1, §4). Ported.
- [x] **Date/time = TWO markers** — sticky DATE pill per day + inline TIME marker per cluster (20-min gap); **no per-bubble stamp** (§4). Ported. *(Pending: locale-by-chat-language formatting — the mock uses a fixed 12h format.)*
- [ ] **Header height `h-[60px]` + `border-b border-border`** shared across rail & main so dividers line up (§6).
- [ ] **Rail geometry** — icon rail 92px; left list 240–480 (default 300, snap 200); right 240–460 (default 340) (§6).
- [ ] **Resizer** — measures pointer X only; page owns clamp/snap; hairline `group-hover:bg-primary/40` (§6, §7).
- [ ] **ScrollArea `display:table`→`block` fix** — or highlights clip & truncation never fires (§7).
- [x] **No-flash theme script** owns `.dark` + accent vars on `<html>` before paint (§7). Ported. *(This WAS the black-on-black bug: `.dark` on an inner div let `<body>`'s inherited `color` resolve outside the theme.)*
- [x] **RELIABILITY GATE — contrast** (`gates/contrast.mjs`, wired into `npm run build`): WCAG 2.1 for every token pair × 5 accents × light/dark; fails build < 4.5 (text) / 3.0 (UI). Found + fixed 2 real AA fails (light Ice/Jade white-ink pills). **Rule enforced:** white ink lives ONLY on `--accent-solid` (fixed L 0.50/0.52), never raw `--primary`.
- [x] **RELIABILITY GATE — theme completeness** (`gates/theme.mjs`, in `npm run build`): every token defined in one theme exists in both; every `var(--x)` resolves at `:root`. Found + fixed: `--cu` undefined, 3 dead shadcn primitives referencing undefined `--secondary`/`--radius-md` (deleted).
- [x] **RELIABILITY GATE — responsive** (`gates/browser.mjs`, in `npm run verify`): puppeteer asserts NO horizontal overflow at 320/768/1180/1440 + app renders. Passing.
- [x] **RELIABILITY GATE — a11y** (`gates/browser.mjs`): axe-core WCAG2 A/AA, dark + light, fails on serious/critical. Found + fixed what the token gate couldn't see (rendered opacity + real font-size): `muted-foreground/60` time marker, `text-primary` small text (→ new `--accent-ink`), `--faint` label text below 4.5 (raised), faint-on-panel (→ muted). **`--accent-ink`** = accent as TEXT (dark in light / light in dark); **`--faint`** now clears AA as real text; faint only on `--background`, muted on raised panels.
- [x] **Reduced-motion guard** — `@media (prefers-reduced-motion: reduce)` neutralises all motion (astrobot's §9 gap, now filled in astro-ui).
- [ ] **`min-w-0` / truncation discipline** on every truncating flex child (§7).
- [ ] **`.no-scrollbar` rail roster**, theme-matched thin scrollbars, accent `::selection` (§7).
- [ ] **Composer** — `rounded-3xl border bg-card`, auto-grow to 200px, send = mono `bg-foreground` circle (NOT accent) (§5).
- [ ] **Typography scale** — Geist / Geist Mono; the exact size/weight table (§8).
- [ ] **Reduced-motion guard** — astrobot has NONE; add one in astro-ui (§9, gap to fix, not copy).

---

*(Below: the full extracted inventory, verbatim, with source refs. Treat it as the spec.)*

## 1. Design tokens

**The one accent knob** (`app/globals.css:51-58`) — `--acc-h` (hue) + `--acc-c` (chroma) are the ONLY
two knobs; almost every colour is `oklch(L C var(--acc-h))`, including the "neutral" greys (tiny
chroma `0.004`–`0.012`) so the whole surface shifts with the accent. Default `--acc-h: 226; --acc-c: 0.11` (Ice).
Accent palette (`lib/theme.ts:21-31`): **Ice** h226 c0.11 · **Iris** h292 c0.13 · **Rose** h12 c0.15 ·
**Amber** h70 c0.13 · **Jade** h158 c0.12 · **Black** h226 c0 (neutral). `DEFAULT_ACCENT = Ice`,
`DEFAULT_MODE = "dark"`. Storage: `astrobot.mode`, `astrobot.acc` (`"h,c"`).

`:root` (LIGHT) `globals.css:56-94` | `.dark` (DARK) `globals.css:161-194`:

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(0.99 0.004 h)` | `oklch(0.155 0.005 h)` |
| `--foreground` | `oklch(0.22 0.012 h)` | `oklch(0.96 0.004 h)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.19 0.006 h)` |
| `--popover` | `oklch(1 0 0)` | `oklch(0.20 0.006 h)` |
| `--primary` | `oklch(0.56 c h)` | `oklch(0.80 c h)` |
| `--primary-foreground` | `oklch(0.99 0 0)` | `oklch(0.18 0.03 h)` |
| `--secondary` / `--muted` | `oklch(0.955 0.008 h)` | `oklch(0.235 0.007 h)` |
| `--muted-foreground` | `oklch(0.50 0.014 h)` | `oklch(0.66 0.012 h)` |
| `--accent` (selected/hover FILL) | `oklch(0.93 0.016 h)` | `oklch(0.255 0.009 h)` |
| `--accent-foreground` | `oklch(0.26 0.012 h)` | `oklch(0.96 0.004 h)` |
| `--border` (hairline) | `oklch(0.30 0.02 h / 12%)` | `oklch(1 0 0 / 8%)` |
| `--input` | `oklch(0.30 0.02 h / 16%)` | `oklch(1 0 0 / 12%)` |
| `--ring` | `oklch(0.56 c h)` | `oklch(0.80 c h)` |
| `--radius` | `0.625rem` | — |
| `--destructive` | `oklch(0.58 0.22 25)` | `oklch(0.62 0.2 25)` |
| `--warn` | `oklch(0.62 0.15 70)` | `oklch(0.80 0.13 85)` |
| `--ok` | `oklch(0.55 0.14 155)` | `oklch(0.72 0.15 155)` |

**Sidebar tokens** (`globals.css:87-94`/`187-194`): `--sidebar` light `oklch(0.97 0.008 h)` / dark
`oklch(0.205 0.007 h)` (greyish gunmetal); the rest track the base tokens.

**Bubble / chat tokens** (`globals.css:96-106`/`196-207`):

| Token | Light | Dark |
|---|---|---|
| `--bubble-agent` | `oklch(0.955 0.01 h)` | `oklch(0.225 0.006 h)` |
| `--bubble-user` (vivid, white ink) | `oklch(0.50 c h)` | `oklch(0.52 c h)` |
| `--bubble-user-foreground` | `oklch(0.99 0 0)` | `oklch(0.99 0 0)` |
| `--accent-ink` (prose links/code) | `oklch(0.42 c h)` | `oklch(0.84 c h)` |
| `--code-bg` | `oklch(0.90 calc(c*0.35) h)` | `oklch(0.30 calc(c*0.35) h)` |

**CRITICAL** (`globals.css:96-123`): `--bubble-user` and prose-highlight **LIGHTNESS is FIXED**
(0.50/0.52), NOT `--primary` (whose L is tuned per hue) — so white-ink contrast never depends on
which accent is chosen. Worst measured: 5.86:1 (Jade light) / 7.20:1 (Rose dark), both AA.

**Situation colours** — ONE state→colour source (`globals.css:125-139`): `--situation-needs`
`oklch(0.62 0.22 25)` red · `--situation-working` `oklch(0.76 0.16 150)` green · `--situation-idle`
`oklch(0.55 0.03 240)` · `--situation-rest` `oklch(0.46 0.02 240)` · ULTRA re-tints via
`--situation-ultra-h: 300`. *(astrochat is a comms app, not agents — situation colours are likely
NOT needed; a channel identity colour is separate from the app accent.)*

**Radius scale** (`globals.css:42-48`): base `0.625rem` → sm×0.6 md×0.8 lg×1 xl×1.4 2xl×1.8 3xl×2.2 4xl×2.6.

## 2. Brushed metal (`globals.css:257-269`)

**Dark:**
```css
.brushed-metal{
  background: linear-gradient(180deg,
    oklch(0.208 0.007 var(--acc-h)) 0%,
    oklch(0.190 0.006 var(--acc-h)) 50%,
    oklch(0.174 0.005 var(--acc-h)) 100%);
  box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.028), inset -1px 0 0 oklch(0 0 0 / 0.30);
}
```
**Light** (`:root:not(.dark) .brushed-metal`): brushed aluminium — gradient `0.985→0.965→0.945`,
`box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.6), inset -1px 0 0 oklch(0 0 0 / 0.06)`.
Applied to the left rail `<aside>` (`fleet.tsx:354`, `sidebar.tsx:81`). **No grain, no sheen overlay.**

## 3. Row / list-item treatment (`components/fleet.tsx` `Row` :56-185)

Row is a `<button>`: `flex w-full items-center gap-3.5 rounded-lg px-3 py-3 text-left transition-colors`.
- **Selected** (`fleet.tsx:111`): `selected ? "bg-accent" : "hover:bg-accent/60"` — a plain grey `bg-accent`
  fill wrapping the whole item; **never a border/ring** (comment `fleet.tsx:110`).
- Drag-over only: `ring-1 ring-primary/40`.
- Avatar `size={52}` in `shrink-0`; body `min-w-0 flex-1`.
- Name line `flex items-center justify-between gap-2`: unread dot `size-1.5 rounded-full bg-primary`;
  name `truncate text-[15px]` (`font-semibold` unread / `font-medium`); right meta `flex shrink-0
  items-center gap-1 text-[11px] text-muted-foreground` (Star/Pin `size-3 fill-primary text-primary`, time).
- Role caption `truncate text-[11px] text-muted-foreground/80`.
- Preview `truncate text-[13px]`, colour = live status tint (green/red/purple) else `unread ? text-foreground/80 : text-muted-foreground`.
- Featured tile (`fleet.tsx:424`): `rounded-2xl px-6 py-3`, avatar 72; section header `text-xs font-medium text-muted-foreground/80`.

## 4. Chat thread & bubbles (`components/chat.tsx`, `chat-cards.tsx`)

- Thread scroll (`chat.tsx:487`): `min-h-0 flex-1 overflow-y-auto`, `overscrollBehavior:contain`; inner
  `mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6`.
- **Bubble base** (`chat.tsx:561`): `max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed`.
  Sent `bg-[var(--bubble-user)] text-[var(--bubble-user-foreground)]` + `justify-end`; incoming
  `bg-[var(--bubble-agent)] text-foreground` + `justify-start` (markdown body). No tail.
- Working indicator = ONLY the mascot (`AgentAvatar size=40 state=working`), no typing dots.

**Date/time (PRIORITY) — the two honest markers, NEVER a per-bubble stamp:**
- `CLUSTER_GAP_MS = 20*60*1000` — fresh inline time after a 20-min lull.
- **Locale follows the CHAT language**, not OS: `it → it-IT (24h)`, else `en-US (12h)` (`chat.tsx:102`).
- `fmtTime` → `toLocaleTimeString(locale,{hour:"2-digit",minute:"2-digit"})` → "01:26 PM" / "13:26".
- `dayLabel` → Today / Yesterday / `weekday day month [year]`.
- **DATE pill — STICKY** (`chat.tsx:502`), one per day: `sticky top-1 z-[5] my-1 rounded-full border
  border-border/60 bg-card/85 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur`.
- **TIME marker — INLINE** (`chat.tsx:512`), at each cluster start: `my-0.5 text-[10px] font-medium
  tabular-nums text-muted-foreground/60`. Scrolls with its cluster.
- Auto-scroll follows newest only while parked at bottom (within 40px); jump-to-latest FAB; window 60.
- **List-row time** (`fleet-model.ts:90`): DATE always visible — today→`h:mm a`, this year→`Aug 29, 2:18 PM`, older→`Aug 29 2025`. (Row uses OS locale; thread uses chat language.)

## 5. Composer (`components/composer.tsx`)

- Bar (`composer.tsx:238`): `relative mx-auto max-w-6xl rounded-3xl border border-border bg-card px-4
  pb-2.5 pt-3.5 shadow-sm focus-within:border-ring/60`; dragging `border-ring border-dashed bg-accent/40`.
- Textarea auto-grow `min(scrollHeight,200)px`; `min-h-[24px] resize-none border-0 bg-transparent p-0
  text-sm leading-relaxed`; Enter sends, Shift+Enter newline.
- Attach `+` (`size-8 rounded-lg hover:bg-accent`), mic (`animate-pulse bg-[var(--warn)]/15` listening),
  **send = `grid size-8 rounded-full bg-foreground text-background`** (mono, NOT accent), icon `ArrowUp size-4`.
- Reply banner `rounded-xl border bg-secondary/60`; `/` skill menu inserts a slug chip, opens at msg start only.

## 6. Rail / sidebar geometry (`app/use-page-state.ts`)

- `ICON_RAIL = 92`; left list `MIN 240 / MAX 480 / SNAP 200 / DEFAULT 300`; right `MIN 240 / MAX 460 /
  SNAP 200 / DEFAULT 340`. Resize = clamp(clientX) left / clamp(innerWidth−clientX) right; below SNAP collapses.
- Mobile `(max-width:767px)` → one-column back-stack, no resize, no icon rail.
- **Shared header `h-[60px]` + `border-b border-border`** across rail + main (17 files) so dividers align.
- Expanded rail `<aside class="brushed-metal flex h-full w-full min-w-0 flex-col border-r border-border">`;
  header `h-[60px] px-4` Logo 26 + `+` (`size-7`); search `h-8 rounded-lg bg-black/25 px-2.5` + `⌘K` kbd;
  tabs `grid grid-cols-2 gap-1 rounded-lg bg-black/25 p-1`, active `bg-accent`; list `ScrollArea min-h-0
  flex-1 pl-2 pr-3`; footer `border-t p-2`, nav `rounded-lg px-2.5 py-2`, active `bg-accent`.
- Collapsed icon rail (`sidebar.tsx`): `items-center gap-2 py-5`, icon button `size-16 rounded-2xl`
  selected `bg-accent`, avatar 52; `MAX_ROSTER=8`; nav `size-9 rounded-lg`; dividers `h-px w-9 bg-border`.
- **Resizer** (`resizer.tsx`): `w-2 cursor-col-resize`, hairline `w-px group-hover:bg-primary/40`;
  reports pointer X only; clamp/snap in the page.

## 7. Solved mechanics (do NOT re-derive)

- **Radix ScrollArea fix** (`globals.css:271`): `[data-slot="scroll-area-viewport"] > div { display: block !important; }`
  — the default `display:table` shrink-to-fits the widest child → truncation never fires, highlight clips.
- **No-flash theme** (`layout.tsx:20-35`): head script reads `astrobot.mode` (default dark) + `astrobot.acc`,
  toggles `.dark` and sets `--acc-h`/`--acc-c` before paint; `<html>` has NO className +
  `suppressHydrationWarning` (the script owns those vars, React must not clobber).
- **Resizer measures only; page owns widths.**
- **`min-w-0` on every truncating flex child** + `truncate` on name/role/preview.
- **`.no-scrollbar`** rail roster; theme-matched thin scrollbars (`oklch(1 0 0 / 0.16)` dark thumb,
  10px, `background-clip:content-box`); accent `::selection` = `color-mix(in oklch, var(--primary) 30%, transparent)`.
- `whenLabel` never hides the date; optimistic-bubble de-dupe; peer-envelope parse; ultra 45s hold.

## 8. Typography (`layout.tsx`, `globals.css:10-12`)

Geist (`--font-geist-sans`) + Geist Mono (`--font-geist-mono`) via `next/font/google`; body `antialiased`.
Scale actually used: row name `text-[15px]` (semibold unread / medium); role `text-[11px] muted/80`;
preview `text-[13px]`; meta/time `text-[11px] muted`; section header `text-xs font-medium`; bubble
`text-sm leading-relaxed`; date pill `text-[11px] font-medium`; inline time `text-[10px] font-medium
tabular-nums`; mono `font-mono text-[0.85em]`. `tabular-nums` on times + counts.

## 9. Focus / a11y / motion

- Global (`globals.css:210`): `* { @apply border-border outline-ring/50; }` — accent ring at 50% as outline.
- Tooltips replace native `title=` (`TooltipProvider delayDuration={250}`); ARIA roles on rail tabs;
  `aria-label` on icon buttons; `aria-hidden` on resizer.
- Transitions: pervasive `transition-colors`; width `transition-[width] duration-150`.
- **`prefers-reduced-motion`: NONE in astrobot — a GAP.** astro-ui should ADD a reduced-motion guard, not copy the omission.

---

## 10. Decisions & rationale — the WHY (pass 2, whole-console mine)

> Pass 1 captured *what* the design is. This captures *why* — the judgement, the rejected
> alternatives, the traps — mined from comments/ADRs across every file. Coverage map at the end
> confirms nothing UI/UX in `console/{app,components,lib}` is unread. **[agent-only]** = astrobot's
> agent cockpit, not needed for astrochat, kept for the record.

### Accent / colour / contrast
- **6 accents, one per colour family, well-spaced** — no near-duplicates; every accent is *verified* to keep white bubble-ink ≥4.5:1, so **new accents must stay in the same lightness family** (a pure yellow/lime would break it). `theme.ts:14-28`
- **"Black" accent = neutral (chroma 0), a first-class member** — greys render grey, surfaces keep a faint hue-226 tint. `theme.ts:20,27`
- **Sent-bubble fill lightness FIXED (0.50/0.52), not `--primary`** — so contrast never depends on the chosen accent; dark a hair brighter to glow on black. `globals.css:96-106,196-200`
- **Sent bubble is vivid + white ink** (iMessage/WhatsApp), never a pale pastel ("reads washed-out"). `globals.css:97`
- **Contrast is MEASURED** — WCAG ratios recorded in-comment per accent. `globals.css:116-119`
- **Colour never the only signal** (WCAG 1.4.1) — links keep underline, inline code keeps mono+wash. A code *block* stays neutral (accent-inking 20 lines hurts reading). `globals.css:120-121`; `chat-cards.tsx:114,140`
- **Neutrals follow `--acc-h` at tiny chroma** so the whole surface (incl. #08090a ground) shifts with the accent — astrobot's whole design language. `globals.css:158-208`
- **Selection = accent, not browser blue**; scrollbars theme-matched. `globals.css:225-234`

### Chat / bubbles / time
- **Two-part time, never a per-bubble stamp, never a pinned time** — sticky DATE pill (a date is true all day) + non-sticky TIME divider at each cluster (new day or >20-min lull) so it scrolls WITH its messages. Owner: "the chat is full of this stuff." `chat.tsx:92-99,505-514`
- **Time format follows the CHAT's language, not the OS** (24h it / 12h en). `chat.tsx:100`
- **Auto-scroll follows newest only while parked at bottom** — never yanks you mid-read. `chat.tsx:443`
- **A non-dev must never see raw bash or a harness slug** — humanize at the render layer (by the tool it invoked, never the raw command/name); harness injections degrade to plain prose, never a guess. `chat.tsx:41,71-77,135-195`
- **Remote images in markdown are NEVER fetched** — a render-time read-receipt beacon; placeholder instead. `chat-cards.tsx:97-99`
- **Ref chips: no dead click, no fake id** — a ref with no `open` shows unlinked; unknown slug → plain prose. `chat-cards.tsx:29-30,187`
- **Attachment shows an inline image/file chip, never a raw disk path**; one artifact = one inline card per id, re-save bumps version (never a 2nd bubble). `chat-cards.tsx:158,242`; `chat.tsx:317`
- **"Busy = null" means "can't see", must never render as your-turn** (busy-needs-two-witnesses). `chat-session.ts:105`

### Rows / rail / geometry
- **Left-rail: drag <200 snaps to icon rail (a snap, never a button); else 240–480** (ABOT-010/011). `use-page-state.ts:37`
- **Icon rail (64px) IS the collapsed left rail, not a second nav**; echoes only the IMPORTANT band, overflow → "+N". `sidebar.tsx:11-17`
- **Channels is a TAB of the left rail, a peer of Agents — not a "place"** ("same three bars, different content"; the icon is an affordance, not a second door). `channel-room.tsx:5-13`
- **All column headers share ONE band `h-[60px] border-b`** so controls + the window-wide hairline line up (fixing a rail that opened 20px high with buttons in the content layer). `rail.tsx:103-112`
- **Agent-rail header left half is empty on purpose** — the rail belongs to the chat beside it; naming it repeats the screen (owner decision 2026-09-02). `rail.tsx:108-111`
- **Right rail = two rails, one slot** — a channel gets the channel rail (roster only), not the agent rail wearing a channel's name (its per-agent panes would be dead controls). `page.tsx:235`; `channel-room.tsx:341`
- **Truncation trap: `flex-1` needs `min-h-0`/`min-w-0` on the ROOT, not just the inner scroller** — else it grows past the viewport and drags the composer; row previews need it or `truncate` never fires. `channel-room.tsx:530`; `globals.css:272`

### The honesty doctrine (load-bearing across the app — all relevant to astrochat)
- **Empty ≠ unknown, everywhere** — a failed fetch reads "couldn't load / unreachable," NEVER "you have none"; a blipped read never blanks a list you're looking at. `plugins.tsx:15`; `api.ts:395`; `api-types.ts:256-270`
- **No dead ends (Law 6/7)** — a control is backed by a real route or it's gone/hidden; never a "coming soon" toast for a shipped-looking control (Graphs hidden, Tasks icon only when wired; the legacy picker-scrape category RETIRED not stubbed). `sidebar.tsx:118`; `api.ts:12,350`
- **Never report blind success over an action that can't happen** — routine confirm surfaces the real refusal; an unschedulable routine locks read-only rather than silently not saving. `api.ts:305`; `routine.tsx:121`
- **Never fabricate a list** — rosters/catalogs degrade to `[]`, never invented. `api-map.ts:316`
- **A degrade is VISIBLE, not a log line** — secrets warning renders only on a genuine `secrets_durable:false`, dismissible, non-blocking. `secrets-warning.tsx:9-18`
- **"The screen is authority"** — an ask card is read from a LIVE record, never a transcript scrape. `ask-card.tsx:22`
- **Reference by id, never copy a fact (rule #2)** — a title is a field never an id; id→name has ONE directory that *never answers with an id* (last resort a neutral label; a detector only reports the leak). `vault.tsx:150`; `agent-names.ts:7-40`
- **0-blocks: safety = accountability (ledger + undo), not a permission gate** — no gate UI anywhere; Tasks shows + reverses after the fact (S1/ADR-020). `agents.tsx:4-9`; `tasks.tsx:1-6`
- **Provider-generic usage** — never a hardcoded Claude figure or $-estimate; `reported:false` → honest note, `ok:false` → unknown not "none." `api.ts:153`; `api-types.ts:215`
- **Notifications are NOT a dashboard** — a desktop notification "is an alarm you disable," used sparingly, degrades to a title badge; mesh nudges get a plain dot, never red/never desktop. `notify.ts:24-27`
- **Down-body degrade keeps the last-known arrangement — NEVER wipes to "nothing pinned."** `page.tsx:29`; `use-page-state.ts:210`
- **The browser never holds the bearer token** — same-origin BFF; only the server hop attaches it; `/api/*` is the daemon's namespace so console routes sit outside it. `hostd.ts:5-9`; `app/api/hostd/[...path]/route.ts:2-13`
- **HTTP/1.1 caps 6 streams/origin and never returns a slot** — prefer ONE SSE for many events; poll where a stream would starve reloads ("the seventh never connected"). `hostd.ts:232`
- **Secrets: the model never sees a value** — only a masked handle crosses, and never re-crosses (Law 8). `api.ts:399`

### Composer
- **Presentational about *sending* (parent owns the one `/send`), but owns attachments** (pure composition); dropped/pasted image renders inline, never a path. `composer.tsx:13-19`
- **Nested dragenter/leave → count depth, don't flicker**; textarea keyed on the chat so a switch restores the draft at full height. `composer.tsx:144`
- **A skill affordance offers a token only, never the recipe pasted in**, and won't offer a slug the transcript can't render. `composer.tsx:88`

### First-run / assets
- **First-run splash NEVER blocks the shell (ABOT-032)** — self-opens once (localStorage), any dismissal remembers, re-openable via a controlled prop ("show me again is one prop, not a cleared key"). `onboarding.tsx:6-14`
- **Brand mark ships BOTH black/white files, toggled by theme** (not one recoloured SVG), wrapped as one `role="img"`. `logo.tsx:2-8`

### [agent-only] — captured for the record, NOT for astrochat
- Mascot adapter is the ONE module that knows both sides; state table working→active / ask→attention / unknown→sleeping; no "your turn" bucket; unmapped states never sent (honest offline). `mascot-adapter.ts`
- Runs are first-class parallel entities, not sessions; roles are ephemeral views of one workflow; surfaces paint structured rows never raw astrocode JSON (ADR-037/038). `api-types.ts:406-450`
- Terminal: Ctrl+C = SIGINT (the trap), xterm canvas literal colours + live-accent cursor, mobile reconnect. `terminal.tsx`
- Native coding tools on for every agent, locked "governed," never claimed sandboxed (ADR-030). `tool-grid.tsx`

## Coverage — the extraction is complete, not assumed
Every file under `console/{app,components,lib}` is accounted for (pass 1 + pass 2). Only genuinely
decision-free files are unread: `lib/utils.ts` (`cn`), the `components/ui/*` shadcn/Radix primitives
(except `tooltip.tsx`, captured), and the i18n string tables (`i18n-en.ts`/`i18n-it.ts` — **the source
of record if exact user-facing wording matters**). `globals.css:1-84` (light-mode neutral tokens) is
token-only, no rationale — the one block not printed line-by-line. **Nothing that plausibly carries a
UI/UX judgement remains unreviewed.**

### astrobot source files (source of truth)
`console/app/{globals.css, layout.tsx, page.tsx, use-page-state.ts}`, `console/components/{sidebar,
resizer, fleet, fleet-model, chat, chat-cards, composer, shell-stage}.tsx`, `console/lib/theme.ts`.
Also relevant: `agent-avatar.tsx` (sizes 15/40/52/72), `rail.tsx`, `channel-room.tsx`, `theme-toggle.tsx`.
