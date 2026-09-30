# astro-ui — the unification map (Hermes ↔ astrobot ↔ catalog)

> Two real products were inventoried component-by-component (Hermes inbox UI, ~50 components;
> astrobot console, ~45). **They converge on the same small catalog.** This file is the plan to
> build each shared component **once** in astro-ui and have both apps mount it. AG-UI lens: a
> component is **declarable** (pure JSON props an LLM can author) or **host-owned** (carries live
> callbacks/transport/refs — the app wires it; the *shape* may still be declared).

## The headline

**All 8 current astro-ui primitives already exist in BOTH products.** That's the signal: this
catalog is not invented, it's the shape both apps already grew independently.

| astro-ui catalog | Hermes | astrobot | verdict |
|---|---|---|---|
| **Avatar** | `thread/RowPrimitives.Avatar` (photo/initials + channel badge) | `agent-avatar.AgentAvatar` (mascot + status dot), `channel-room.RosterAvatars` (group) | ✅ same slot — badge = channel/presence; astrobot's mascot is fill behind the same contract |
| **MessageBubble** | `thread/Bubble` (in/out, reactions, reply-quote, @you) | `chat-cards.MarkdownMessage` + bubbles (in/out/peer, trust-scoped) | ✅ same; **merge features**: reactions + reply-quote (Hermes) × trust mode + group-sender (astrobot) |
| **ConversationItem** (row) | `thread/ConversationCard`, `thread/PersonCard` (grouped person) | `fleet.Row`, `channel-room.ChannelListRow` | ✅ same list-row; Hermes's person/multi-channel variant is the richest data shape |
| **ConversationItem** (thread view) | `ThreadHeader` + `MessagesList` | `chat.ChatThread`, `channel-room.ChannelRoom` | ✅ same open-thread facet (header + bubbles + composer region) |
| **Composer** | `ThreadView` composer region | `composer.Composer` | ✅ same input bar (attach/mic/reply/slash) |
| **ChannelButton** | `Sidebar` rail buttons + badge | *(none — astrobot uses text tabs)* | ✅ Hermes-validated; astrobot n/a |
| **Dossier** | `EntityPage` (person/group scheda) | `channel-room.ChannelRail` (roster only — loose) | ✅ Hermes is the real Dossier; astrobot's is a roster → see `RosterPanel` gap |
| **TimeMarker** | day pill in `MessagesList` (+ reused in FileGrid month headers) | date pill + inline cluster time in `chat` | ✅ identical two-part treatment |
| **Stack** | implicit (Tailwind flex) | implicit | ✅ layout container |

**Read:** the comms core is *one* set of 8. Build them once, both apps drop their bespoke copies.

## Catalog gaps to ADD (union of both inventories)

Ranked: needed by BOTH first, then one. "decl." = AG-UI declarable.

### Comms primitives (highest value — the shared reading pane)
| proposed | covers (Hermes / astrobot) | decl.? | note |
|---|---|---|---|
| **Attachment** / **AttachmentList** | `MediaAttachment` / `SentAttachments` | display ✅, actions host | image/video/audio/doc; `gone` fallback; **both** |
| **RichText** | `Linkify` / *(markdown)* | ✅ fully pure | text → links + `@mention` chips; the cleanest AG-UI node |
| **MessageDivider** | *(peer divider)* / `chat` "Message from X" | ✅ | centered exceptional-sender divider |
| **ListSection** | `ThreadList` SectionLabel / `fleet.SectionHeader` | header ✅ | collapsible grouped-list header; **both** |
| **RefChips** | *(entity chips)* / `chat-cards.RefChips` | ✅ | entity-reference chip strip (inert if no `open`) |
| **MessageResultRow** | `thread/MsgHit` / `palette` rows | ✅ + host onClick | highlighted search/sent snippet row |
| **VoiceNote** | `thread/VoiceNote` / — | ❌ host (AudioContext) | comms-specific player |
| **RichEmailBody** | `thread/EmailBody` / — | ❌ host (fetch+iframe) | native/sandboxed email |

### File primitives (both, via drawers/destinations)
| proposed | covers | decl.? |
|---|---|---|
| **FileGrid** | `files/FileGrid` | tiles ✅, download host |
| **MediaLightbox** | `files/QuickLook` / `file-preview.FilePreview` | ❌ host (portal/keyboard) |

### Infra primitives (shared shell plumbing)
| proposed | covers | decl.? |
|---|---|---|
| **Overlay / Modal** | `thread/Overlay` / dialog | ❌ host (portal) |
| **Drawer / DrawerHeader** | `Drawer` / rail editors | header ✅ |
| **ChipInput** | `thread/RecipientRow` | ❌ host |
| **FindBar / SearchField** | `thread/FindBar` / palette search | ❌ host |
| **AlertBanner** | *(degrade banners)* / `SecretsWarning` | mostly ✅ + dismiss |
| **RosterPanel** | *(group members)* / `channel-room.ChannelRail` | host | a roster list ≠ a person Dossier |
| **Tag / IconToggle / FormControls** | `AtChip`/`StarAction` / `settings/primitives` | mixed | low priority |

## Stays per-app (APP-CHROME — composes the catalog, never enters it)
The **shells and orchestration** — they arrange catalog components but are app-specific:
Hermes `ThreadList`, `MessagesList`, `Sidebar` (rail), `ThreadView` (file), `ComposeModal`,
`CommandPalette`, `GlobalFiles`, `FilesPanel`, `ForwardModal`, `GhostControl`, `NudgePanel`,
`DuplicatesPanel`, `AskPanel`, `OnboardingWizard`, `SettingsPanel` + `settings/*`, `EmptyState`. ·
astrobot `FleetList`, `CollapsedSidebar`, `ShellStage`, `ShellModals`, `NewBotModal`,
`SettingsPanel`, `SettingsModal`, `Onboarding`, `ResizeHandle`.

## Out of the shared system (AGENT-ONLY — astrobot cockpit, not astrochat)
`ask-card` family (8 approval cards), mesh (`PairView`/`BusRow`), `ActivityBlock`/`StepLine`
(humanized machinery), `AgentRail` (PTY+routines), `Terminal`/`BrowserPreview`, `run/*`
(PhaseCard/HandoffLog — declarable but agent), `tool-grid`, `vault`/`vault-reader`, `tasks`,
`routine`, `plugins`, `AgentsTab`. Keep out of astro-ui.

## The one decision this surfaces: astro-ui vs `@soma/ui`
Hermes **already imports a shared skin** — `@soma/ui` (`Empty`, `Rail*`, `ProfileSheet`,
`PaneResizer`, `Progress`, `Tip`, `SkeletonRows`) — and several Hermes components are already thin
adapters over it (`EmptyState`, `Sidebar`, `SettingsPanel`, `OrganProgress`). So there are **two
shared-UI efforts**: `@soma/ui` (inside SOMA, imperative primitives) and `astro-ui` (outside,
declarative catalog). Unification has to pick the relationship — **recommended:** astro-ui is the
canonical **catalog** (the declarative comms primitives above); `@soma/ui`'s non-comms infra
(`Empty`, `Progress`, `PaneResizer`, `SkeletonRows`) is either absorbed into astro-ui's infra tier
or kept as SOMA-internal and mapped 1:1. Do **not** grow a third vocabulary. (astrochat stays
zero-`@soma` — it consumes astro-ui only.)

## AG-UI declarability tiers (what the LLM may author vs what the app wires)
- **Fully declarable** (pure JSON, no callbacks): `RichText`, `TimeMarker`, `MessageBubble` (body),
  `Avatar`, `MessageDivider`, `RefChips`, `Dossier` (data), `ConversationItem` (data), `ListSection`.
  → these are the LLM's real vocabulary.
- **Declarable shape, host-mediated interaction** (data-attribute dispatch, per phase 31): rows'
  `onSelect`, bubble hover verbs, `ChannelButton` filter, `MessageResultRow` click.
- **Host-owned** (live logic, never JSON): `Composer` (MediaRecorder/send), `VoiceNote`,
  `RichEmailBody`, `Overlay`/`MediaLightbox` (portals), `FileGrid` download, every fetch panel.

## The plan (build once, reuse twice)
1. **Lock the 8** — the catalog is validated by both products; freeze their contracts (props schema).
2. **Merge features into the 8** where the two diverged: MessageBubble = reactions + reply-quote (Hermes) × trust + group-sender (astrobot); ConversationItem row = person/multi-channel (Hermes) + status-tint (astrobot); Dossier = EntityPage's full scheda.
3. **Add the comms gaps** in priority order: `Attachment`, `RichText`, `ListSection`, `MessageDivider`, `RefChips`, `MessageResultRow`, then `VoiceNote`/`RichEmailBody`, then file + infra tiers.
4. **Every new component ships through the gates** (contrast / theme / a11y / contract) — reliability is not optional for a shared library.
5. **Migrate app-by-app**: astrochat (greenfield, astro-ui only) proves the catalog; Hermes swaps its bespoke `thread/*` for astro-ui behind the existing contract, reconciling with `@soma/ui`.

---

## Progress — SOMA → astro rework (in flight)

- [x] **RichText** ← Hermes `thread/Linkify.tsx` — NEW catalog component. Markdown/bare links + `@mention` chips; `trust:"peer"` → inert links. Fully declarable. Tokens mapped (`--accent`→`--accent-ink`). Gated.
- [x] **MessageBubble** — feature-merge landed: Hermes `Bubble` (reactions folded w/ count+who+self, reply-quote, `@you` ring, hover reply/react/forward) × astrobot (in/out, group sender, trust). Actions are `data-action`/`data-msg-id` (host-mediated, no callbacks). All SOMA `--accent`/`--ink-*`/`color-mix` literals mapped to astro tokens; nested blocks (quote, reaction pills) sit on solid `--card` (a11y — acc-dim-behind-muted failed axe). Gated (140 contrast checks, axe A/AA dark+light, 5 tests).
- [ ] next comms gaps in priority order: **ListSection** (`fleet.SectionHeader`/`ThreadList` sections) · **MessageDivider** · **RefChips** (`chat-cards.RefChips`) · **Attachment** (`MediaAttachment`/`SentAttachments`) · **MessageResultRow** (`MsgHit`) · then `VoiceNote`/`RichEmailBody`, file + infra tiers.
- [ ] then: promote the catalog out of `spike/declarative-ui/` into a publishable `astro-ui` package; migrate Hermes `thread/*` onto it behind the existing contract (reconciling `@soma/ui`).

Home today: the catalog + gates live in `spike/declarative-ui/`. Every ported component ships through `npm run verify` (contrast · theme/no-hardcoded · responsive · axe A/AA · contract tests).

---

## Redundancy pass — one component per use (supersedes the gap list above)

Principle (owner): **one component per use, extended by props; two components only when they are
GENUINELY different uses — never "the same thing with more features."** Applied to the whole gap
list, most proposals collapse.

### Final catalog — 13 shipped, gated (`npm run verify`: contrast · theme/no-hardcoded · responsive · axe A/AA · contract)
`Stack` · `Avatar` · `MessageBubble` · `ConversationItem` · `Composer` · `ChannelButton` · `Dossier`
· `RichText` · `ThreadMarker` · `ListSection` · `Chip` · `Attachment` · `AlertBanner`

### Redundancies collapsed (were going to be separate components — they were not different uses)
| collapsed | into | why it was the same use |
|---|---|---|
| `TimeMarker` + `MessageDivider` | **ThreadMarker** (kind date/time/label) | all three are "a marker between messages" |
| `RefChips` · `Tag` · Dossier topic-chip · Dossier channel-chip | **Chip** (+ `Stack` for a strip) | all are "a small labelled pill"; a strip is a Stack of them |
| `AttachmentChip` · `StagedAttachment` · `FileGrid` tile | **Attachment** (variant chip/tile/card/inline) | all are "a file rendered"; a grid is a layout of them |
| `MessageResultRow` | **ConversationItem** (snippet variant) | a search-hit row is a list row + a highlighted snippet prop |
| `RosterPanel` | **Dossier** (group variant) | a channel roster IS a group's members — Dossier already has group mode |
| `FindBar` | **SearchField** (counter variant) | find-in-thread is a search input + a match counter |
| `Modal` + `Drawer` | **Overlay** (placement center/side) | both are "a surface over content"; placement is a prop |

### Genuinely different — kept separate (NOT just "more extension")
- **Chip** (display pill) vs **ChipInput** (a field that *produces* chips) — display ≠ input.
- **Attachment** (inline/card thumbnail) vs **MediaLightbox** (immersive fullscreen viewer) — a thumbnail ≠ a viewer.
- **RichText**, **VoiceNote**, **RichEmailBody** — three distinct body renderers (text vs audio vs sandboxed email), not variants of one.

### Remaining tier — build WITH the surface that exercises them (host-owned; not shipped as blind shells)
Per "verify before done": these carry live logic (portals, AudioContext, iframe fetch, controlled
inputs) that the astrochat mock can't exercise, so they're built when their backend/host surface
lands, not faked now:
**SearchField** (+FindBar counter) · **ChipInput** · **Overlay** (Modal/Drawer) · **VoiceNote** ·
**RichEmailBody** · **MediaLightbox**. Each maps to exactly one SOMA source (see the table up top).

### Net effect
The ~23 components the raw union implied are **13 shipped + 6 host-owned-to-come = 19**, not 23 —
and every one of the 13 is a single use, extended by props, verified. The reading pane a comms app
actually renders is **done**.
